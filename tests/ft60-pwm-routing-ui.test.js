import test from 'node:test';
import assert from 'node:assert/strict';
import {createProject} from '../src/core/project.js';
import {devices} from '../src/data/devices.js';
import {setFt60PwmRoutingControl,releaseFt60PwmRoutingPin,createFt60PwmRoutingUi} from '../src/ui/ft60-pwm-routing-ui.js';
import {ft60PwmRouting} from '../src/core/ft60-pwm-routing.js';
const dev=id=>devices.find(d=>d.id===id);
function fixture(id='FT60E211'){const p=createProject();p.device=id;return p;}
test('FT60 PWM1N claims PA4, clears conflicts, and initializes Timer2',()=>{
 const p=fixture();Object.assign(p.peripherals,{ft60Pwm2:1,ft60Ioc:16,ft60Lvd:2,ft60LvdInput:2});p.pins.PA4='GPIO input';
 setFt60PwmRoutingControl(p,dev(p.device),'ft60Pwm1N',1);
 assert.equal(p.peripherals.ft60Pwm2,0);assert.equal(p.peripherals.ft60LvdInput,0);assert.equal(p.peripherals.ft60Ioc&16,0);assert.equal(p.peripherals.timer2,0);assert.equal(p.pins.PA4,'GPIO output');
 assert.equal(ft60PwmRouting(p,dev(p.device)).oe,2);
});
test('FT60 alternate outputs configure duty on alt-only channels and release conflicting LVD',()=>{
 const p=fixture();Object.assign(p.peripherals,{ft60Lvd:1,ft60LvdInput:1,ft60Mode:1,ft60Ioc:32});
 setFt60PwmRoutingControl(p,dev(p.device),'ft60Pwm4Alt',1);setFt60PwmRoutingControl(p,dev(p.device),'ft60Duty4',75);
 assert.equal(p.peripherals.ft60Mode,0);assert.equal(p.peripherals.ft60LvdInput,0);assert.equal(p.peripherals.ft60Ioc&32,0);assert.equal(p.peripherals.ft60Duty4,75);assert.equal(p.pins.PA5,'GPIO output');assert.equal(ft60PwmRouting(p,dev(p.device)).activeChannels[3],true);
 releaseFt60PwmRoutingPin(p,'PA5');assert.equal(p.peripherals.ft60Pwm4Alt,0);
});
test('FT60 UI rejects unavailable pins and invalid numeric settings without mutation',()=>{
 const p=fixture('FT60E210');assert.throws(()=>setFt60PwmRoutingControl(p,dev(p.device),'ft60Pwm4Alt',1),/unavailable/);assert.equal(p.pins.PA5,undefined);
 assert.throws(()=>setFt60PwmRoutingControl(p,dev(p.device),'ft60Duty4',101),/Invalid/);assert.throws(()=>setFt60PwmRoutingControl(p,dev(p.device),'other',0),/Invalid/);
});
class Element {constructor(tag){this.tag=tag;this.children=[];this.hidden=false;this.listeners={};}append(...nodes){this.children.push(...nodes);}addEventListener(name,fn){this.listeners[name]=fn;}}
const doc={createElement:tag=>new Element(tag)};
test('FT60 PWM routing component reflects package availability and handles changes',()=>{
 let p=fixture('FT60E210'),d=dev(p.device),redraws=0;const panel=new Element('section');
 const ui=createFt60PwmRoutingUi({panel,getProject:()=>p,getDevice:()=>d,render:()=>{redraws++;ui.sync();},document:doc});ui.sync();
 assert.equal(ui.card.hidden,false);assert.equal(ui.card.children[1].hidden,false);assert.equal(ui.card.children[2].hidden,false);assert.equal(ui.card.children[3].hidden,true);
 const group=ui.card.children[1], select=group.children[0].children[1];select.value='1';select.listeners.change();assert.equal(p.peripherals.ft60Pwm1N,1);assert.equal(redraws,1);assert.equal(group.children[1].children[1].disabled,false);
 d={family:'FT61EC2x',pins:[]};ui.sync();assert.equal(ui.card.hidden,true);
});
