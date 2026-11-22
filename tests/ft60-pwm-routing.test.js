import test from 'node:test';
import assert from 'node:assert/strict';
import {createProject} from '../src/core/project.js';
import {devices} from '../src/data/devices.js';
import {ft60PwmRouting} from '../src/core/ft60-pwm-routing.js';
const device=(id)=>devices.find(d=>d.id===id);
function fixture(){const p=createProject();p.device='FT60E211';p.peripherals.timer2=0;return p;}
test('FT60 complementary PWM1 supports independent polarity and PA4',()=>{
 const p=fixture();p.pins={PA3:'GPIO output',PA4:'GPIO output'};Object.assign(p.peripherals,{ft60Pwm1:1,ft60Pwm1N:1,ft60Pwm1NPolarity:1});
 const r=ft60PwmRouting(p,device(p.device));assert.equal(r.oe,3);assert.equal(r.pol,2);assert.deepEqual(r.activeChannels,[true,false,false,false]);
 p.peripherals.ft60Pwm2=1;assert.throws(()=>ft60PwmRouting(p,device(p.device)),/Multiple PWM/);
});
test('FT60 alternate PWM3/4 independent routing and fault states',()=>{
 const p=fixture();p.pins={PA0:'GPIO output',PA5:'GPIO output'};Object.assign(p.peripherals,{ft60Pwm3Alt:1,ft60Pwm4Alt:1,ft60FaultAlt3:1,ft60FaultAlt4:2,ft60FaultState3:1,ft60FaultState4:2});
 const r=ft60PwmRouting(p,device(p.device));assert.equal(r.oe,0x04);assert.equal(r.br1,0xAD);assert.deepEqual(r.activeChannels,[false,false,true,true]);
 p.peripherals.ft60Mode=1;assert.throws(()=>ft60PwmRouting(p,device(p.device)),/one-pulse/);
});
test('FT60 alternate routes check package, LVD, pin direction and Timer2',()=>{
 const p=fixture();p.device='FT60E210';p.pins={PA5:'GPIO output'};p.peripherals.ft60Pwm4Alt=1;assert.throws(()=>ft60PwmRouting(p,device(p.device)),/unavailable/);
 p.device='FT60E211';p.peripherals.ft60Lvd=2;p.peripherals.ft60LvdInput=1;assert.throws(()=>ft60PwmRouting(p,device(p.device)),/LVD/);
 p.peripherals.ft60Lvd=-1;p.pins.PA5='GPIO input';assert.throws(()=>ft60PwmRouting(p,device(p.device)),/configured as output/);
 p.pins.PA5='GPIO output';p.peripherals.timer2=-1;assert.throws(()=>ft60PwmRouting(p,device(p.device)),/Timer2/);
});
test('FT60 alternate routes cannot share pins with interrupt-on-change',()=>{
 const p=fixture();p.pins={PA0:'GPIO output'};Object.assign(p.peripherals,{ft60Pwm3Alt:1,ft60Ioc:1});assert.throws(()=>ft60PwmRouting(p,device(p.device)),/interrupt-on-change/);
});
test('FT60 all compatible primary, complementary and alternate outputs preserve independent masks',()=>{
 const p=fixture();p.pins={PA0:'GPIO output',PA1:'GPIO output',PA2:'GPIO output',PA3:'GPIO output',PA4:'GPIO output',PA5:'GPIO output'};
 Object.assign(p.peripherals,{ft60Pwm1:1,ft60Pwm1N:1,ft60Pwm3:1,ft60Pwm3Alt:1,ft60Pwm4:1,ft60Pwm4Alt:1,ft60Polarity1:1,ft60Polarity3:1,ft60Polarity4:1,ft60Pwm1NPolarity:1,ft60FaultAlt3:2,ft60FaultAlt4:1});
 const r=ft60PwmRouting(p,device(p.device));assert.equal(r.outputs.length,6);assert.equal(r.oe,0xAB);assert.equal(r.br1,0x1C);assert.equal(r.pol,0xA3);assert.deepEqual(r.activeChannels,[true,false,true,true]);
});
