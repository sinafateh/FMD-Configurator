// Optional integration test using the locally installed FMD compiler.
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createProject} from '../src/core/project.js';
import {generateInit} from '../src/core/generator.js';
const compiler=process.env.FMD_COMPILER || 'C:/Program Files (x86)/CCompiler/Compiler/data/bin/gcc8.exe';
if(!existsSync(compiler)){console.error('FMD compiler not found. Set FMD_COMPILER.');process.exit(1);}
const cases=[
 {name:'gpio',pins:{PA0:'GPIO output',PC1:'GPIO input',PC2:'GPIO output'},body:'FMD_Init(); while (1) { }'},
 {name:'adc_one',pins:{PA1:'AN1',PC2:'GPIO output'},body:'FMD_Init(); while (1) { }'},
 {name:'adc_multi',pins:{PA0:'AN0',PA1:'AN1',PC1:'AN5'},body:'FMD_Init(); while (1) { }'},
 {name:'pwm',pins:{PC2:'GPIO output',PC3:'GPIO output'},peripherals:{timer4:1,timer5:2,pwm4:1,pwm5:1,pwm4Duty:100,pwm5Duty:25},body:'FMD_Init(); while (1) { }'},
 {name:'additional_timers',pins:{},peripherals:{timer3:2,timer4:3,timer5:4,lvd:3,irqTimer0:1,irqTimer1:1,irqTimer2:1,irqADC:1},body:'FMD_Init(); while (1) { }'},
 {name:'timers_watchdog',pins:{PA1:'AN1'},peripherals:{adcRef:2,timer0:3,timer1:2,timer2:1,watchdog:4},body:'FMD_Init(); while (1) { }'}
];
for(const c of cases){const dir=resolve('build','compiler-check',c.name);mkdirSync(dir,{recursive:true});const p=createProject();p.device='FT61EC21B';p.pins=c.pins;if(c.peripherals)Object.assign(p.peripherals,c.peripherals);writeFileSync(resolve(dir,'main.c'),generateInit(p));const run=spawnSync(compiler,['--chip=FT61F02X','-D_FT61EC2X','main.c'],{cwd:dir,encoding:'utf8',windowsHide:true});if(run.error||run.status!==0||!existsSync(resolve(dir,'main.hex'))){console.error('FAIL',c.name,run.error||'',run.stdout,run.stderr);process.exit(1);}console.log('PASS',c.name,': compiled and linked to HEX');}
