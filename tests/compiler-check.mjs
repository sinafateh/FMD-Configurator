// Optional integration test using the locally installed FMD compiler.
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createProject} from '../src/core/project.js';
import {generateInit} from '../src/core/generator.js';
const compiler=process.env.FMD_COMPILER || 'C:/Program Files (x86)/CCompiler/Compiler/data/bin/gcc8.exe';
if(!existsSync(compiler)){console.error('FMD compiler not found. Set FMD_COMPILER.');process.exit(1);}
const cases=[
 {name:'ft61_adc_external_vref',device:'FT61EC23',pins:{PA1:'AN1',PC0:'ADC VREF'},peripherals:{adcRef:3,ft61AdcFirst:1,ft61AdcDivs:1,ft61AdcClock:4,ft61AdcFormat:0}},
 {name:'ft61_adc_internal_vdd',device:'FT61EC21B',pins:{},peripherals:{ft61AdcFirst:7}},
 {name:'ft60_timer0_external',device:'FT60E211',chip:'FT60F21X',define:'_FT60E21X',pins:{PA2:'GPIO input + pull-up'},peripherals:{timer0:3,ft60T0Source:3,ft60T0Edge:1,ft60T0Sleep:1}},
 {name:'ft60_watchdog_scaler',device:'FT60E210',chip:'FT60F21X',define:'_FT60E21X',pins:{},peripherals:{watchdog:4,ft60WdtPost:5,ft60WdtClock:1}},
 {name:'ft61_gpio_interrupts',device:'FT61EC21B',pins:{PA0:'GPIO input + pull-up',PC1:'GPIO input + pull-down'},peripherals:{ft61Ioc:1,ft61Edge:1}},
 {name:'ft60e211', device:'FT60E211', chip:'FT60F21X', define:'_FT60E21X', pins:{PA0:'GPIO output',PA4:'GPIO output',PA1:'GPIO output',PA5:'GPIO input',PA2:'GPIO input + pull-up'}, peripherals:{timer0:3,timer2:1,watchdog:4,irqTimer0:1,irqTimer2:1,ft60Pwm2:1,ft60Pwm4:1,ft60Duty2:100,ft60Duty4:25,ft60Lvd:3,ft60LvdInput:1,ft60LvdPolarity:1,ft60LvdIrq:1,ft60Period:1999,ft60Deadband:12,ft60Mode:1,ft60Polarity4:1,ft60Fault:3,ft60AutoResume:1,ft60FaultState1:1,ft60FaultState2:2,ft60FaultState3:1,ft60FaultState4:2,ft60Ioc:4,ft60Edge:1,ft60T2Period:1234,ft60T2Post:3,ft60T2Clock:5,ft60T2Sleep:1,ft60LircMode:1,ft60Source4:1,ft60Source5:3,ft60Sink4:0,ft60Sink5:1}},
 {name:'gpio',pins:{PA0:'GPIO output',PC1:'GPIO input',PC2:'GPIO output'},body:'FMD_Init(); while (1) { }'},
 {name:'adc_one',pins:{PA1:'AN1',PC2:'GPIO output'},body:'FMD_Init(); while (1) { }'},
 {name:'adc_multi',pins:{PA0:'AN0',PA1:'AN1',PC1:'AN5'},body:'FMD_Init(); while (1) { }'},
 {name:'pwm',pins:{PC2:'GPIO output',PC3:'GPIO output'},peripherals:{timer4:1,timer5:2,pwm4:1,pwm5:1,pwm4Duty:100,pwm5Duty:25},body:'FMD_Init(); while (1) { }'},
 {name:'additional_timers',pins:{},peripherals:{timer3:2,timer4:3,timer5:4,lvd:3,irqTimer0:1,irqTimer1:1,irqTimer2:1,irqADC:1},body:'FMD_Init(); while (1) { }'},
 {name:'timers_watchdog',pins:{PA1:'AN1'},peripherals:{adcRef:2,timer0:3,timer1:2,timer2:1,watchdog:4},body:'FMD_Init(); while (1) { }'}
];
for(const c of cases){const dir=resolve('build','compiler-check',c.name);mkdirSync(dir,{recursive:true});const p=createProject();p.device=c.device||'FT61EC21B';p.pins=c.pins;if(c.peripherals)Object.assign(p.peripherals,c.peripherals);writeFileSync(resolve(dir,'main.c'),generateInit(p));const run=spawnSync(compiler,['--chip='+(c.chip||'FT61F02X'),'-D'+(c.define||'_FT61EC2X'),'main.c'],{cwd:dir,encoding:'utf8',windowsHide:true});if(run.error||run.status!==0||!existsSync(resolve(dir,'main.hex'))){console.error('FAIL',c.name,run.error||'',run.stdout,run.stderr);process.exit(1);}console.log('PASS',c.name,': compiled and linked to HEX');}
