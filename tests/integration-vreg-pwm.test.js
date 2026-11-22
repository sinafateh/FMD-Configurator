import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createProject,validateProject} from '../src/core/project.js';
import {generateInit} from '../src/core/generator.js';
import {devices} from '../src/data/devices.js';
import {setFt61VregEnabled,normalizeFt61VregDevice} from '../src/ui/ft61-vreg.js';
import {setFt60PwmRoutingControl,createFt60PwmRoutingUi} from '../src/ui/ft60-pwm-routing-ui.js';

const device=id=>devices.find(d=>d.id===id);
const make=id=>{const p=createProject();p.device=id;return p;};
const compiler=process.env.FMD_COMPILER||'C:/Program Files (x86)/CCompiler/Compiler/data/bin/gcc8.exe';

test('VREG shares output pins with GPIO while ADC and Timer2 remain configured',()=>{
 const p=make('FT61EC23');p.pins={PA4:'GPIO input + pull-down',PC5:'GPIO output',PC0:'ADC VREF',PA1:'AN1'};
 Object.assign(p.peripherals,{ft61Ioc:16,adcRef:3,ft61AdcFirst:1,timer2:1,ft61VregRef:2,ft61VregP:15,ft61VregN:31});
 setFt61VregEnabled(p,device(p.device),true);
 assert.equal(p.pins.PA4,undefined);assert.equal(p.pins.PC5,undefined);assert.equal(p.peripherals.ft61Ioc,0);
 assert.equal(validateProject(p),p);
 const code=generateInit(p);
 assert.match(code,/ADCON0 = 0xE5/);assert.match(code,/T2CON = 0x05/);
 assert.match(code,/VCON1 = \(VCON1 & 0x80u\) \| 0x4F/);assert.match(code,/VCON2 = \(VCON2 & 0xE0u\) \| 0x1F/);
 assert.ok(code.indexOf('MSCKCON &= (unsigned char)~(1u << 5)')<code.indexOf('MSCKCON |= (1u << 6)'));
 p.pins.PA4='GPIO output';assert.throws(()=>validateProject(p),/regulator/i);
});

test('VREG normalizes enabled state when switching FT61 packages',()=>{
 const p=make('FT61EC23');setFt61VregEnabled(p,device(p.device),true);
 p.device='FT61EC22A';normalizeFt61VregDevice(p,device(p.device));assert.equal(p.peripherals.ft61Vreg,1);assert.doesNotThrow(()=>generateInit(p));
 p.device='FT61EC21B';normalizeFt61VregDevice(p,device(p.device));assert.equal(p.peripherals.ft61Vreg,0);assert.doesNotThrow(()=>generateInit(p));
});

test('FT60 alternate and complementary PWM routes generate and validate as a single project',()=>{
 const p=make('FT60E211'),d=device(p.device);
 for(const key of ['ft60Pwm1N','ft60Pwm3Alt','ft60Pwm4Alt'])setFt60PwmRoutingControl(p,d,key,1);
 Object.assign(p.peripherals,{ft60Duty1:20,ft60Duty3:50,ft60Duty4:75,ft60Pwm1NPolarity:1,ft60FaultAlt3:2,ft60FaultAlt4:1});
 assert.equal(validateProject(p),p);const code=generateInit(p);
 assert.match(code,/P1OE = 0x0A/);assert.match(code,/P1BR1 = 0x1C/);assert.match(code,/P1POL = 0x02/);
 assert.match(code,/P1ADTL = 0xC8/);assert.match(code,/P1CDTL = 0xF4/);assert.match(code,/P1DDTL = 0xEE/);
 assert.ok(code.indexOf('P1OE =')<code.indexOf('T2CON0 |= (1u << 2)'));
 p.peripherals.ft60Ioc=1;assert.throws(()=>validateProject(p));
});

test('FT60 routing rejects incompatible package and shared PA4 output',()=>{
 const p=make('FT60E211'),d=device(p.device);setFt60PwmRoutingControl(p,d,'ft60Pwm1N',1);
 p.peripherals.ft60Pwm2=1;assert.throws(()=>validateProject(p),/Multiple PWM/);
 p.peripherals.ft60Pwm2=0;setFt60PwmRoutingControl(p,d,'ft60Pwm4Alt',1);
 p.device='FT60E210';assert.throws(()=>validateProject(p),/unavailable/i);
});

class Element {constructor(tag){this.tag=tag;this.children=[];this.hidden=false;this.listeners={};}append(...nodes){this.children.push(...nodes);}addEventListener(name,fn){this.listeners[name]=fn;}}
test('alternate PWM controls do not duplicate the IDs of primary duty inputs',()=>{
 const p=make('FT60E211'),panel=new Element('section'),doc={createElement:tag=>new Element(tag)};
 const ui=createFt60PwmRoutingUi({panel,getProject:()=>p,getDevice:()=>device(p.device),render:()=>{},document:doc});
 const ids=[];const visit=el=>{if(el.id)ids.push(el.id);for(const child of el.children)visit(child);};visit(ui.card);
 for(const id of ['ft60Duty1','ft60Duty2','ft60Duty3','ft60Duty4'])assert.ok(!ids.includes(id),`Duplicate primary control ID: ${id}`);
 assert.equal(new Set(ids).size,ids.length);
});

test('integrated VREG and routed PWM projects compile and link with FMD compiler',{skip:!existsSync(compiler)},()=>{
 const cases=[];const vreg=make('FT61EC23');vreg.pins={PA1:'AN1'};Object.assign(vreg.peripherals,{timer2:1,ft61Vreg:1,ft61VregRef:2,ft61VregP:15,ft61VregN:31});cases.push([vreg,'FT61F02X','_FT61EC2X']);
 const pwm=make('FT60E211');for(const key of ['ft60Pwm1N','ft60Pwm3Alt','ft60Pwm4Alt'])setFt60PwmRoutingControl(pwm,device(pwm.device),key,1);Object.assign(pwm.peripherals,{ft60FaultAlt3:2,ft60FaultAlt4:1,ft60Duty1:20,ft60Duty3:50,ft60Duty4:75});cases.push([pwm,'FT60F21X','_FT60E21X']);
 for(const [p,chip,define] of cases){const dir=mkdtempSync(join(tmpdir(),'fmd-integration-'));try{writeFileSync(join(dir,'main.c'),generateInit(p));const run=spawnSync(compiler,['--chip='+chip,'-D'+define,'main.c'],{cwd:dir,encoding:'utf8',windowsHide:true});assert.equal(run.status,0,`${p.device}: ${run.error||''}\n${run.stdout}\n${run.stderr}`);assert.ok(existsSync(join(dir,'main.hex')));}finally{rmSync(dir,{recursive:true,force:true});}}
});
