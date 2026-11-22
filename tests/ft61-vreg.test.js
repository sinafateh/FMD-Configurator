import test from 'node:test';
import assert from 'node:assert/strict';
import {ft61VregDefaults,ft61VregNominal,validateFt61Vreg,generateFt61Vreg} from '../src/core/ft61-vreg.js';
const package14={pins:['PA4','PA0','PA1']}, package16={pins:['PA4','PC5','PA0']}, small={pins:['PA0','PA1']};
function project(overrides={}){return {pins:{},peripherals:{...ft61VregDefaults,...overrides}};}
test('VREG levels implement the datasheet formula',()=>{
 assert.equal(ft61VregNominal(0,31),2.4);assert.equal(ft61VregNominal(2,15),2.4);
 assert.throws(()=>ft61VregNominal(4,2));assert.throws(()=>ft61VregNominal(0,32));
});
test('single enable reserves both bonded pins and rejects unavailable packages',()=>{
 const p=project({ft61Vreg:1});assert.doesNotThrow(()=>validateFt61Vreg(p,package14));assert.doesNotThrow(()=>validateFt61Vreg(p,package16));
 assert.throws(()=>validateFt61Vreg(p,small));p.pins.PC5='GPIO output';assert.throws(()=>validateFt61Vreg(p,package16));
 delete p.pins.PC5;p.pins.PA4='GPIO input';assert.throws(()=>validateFt61Vreg(p,package14));
});
test('GPIO/IOC conflict and invalid levels are rejected',()=>{
 const p=project({ft61Vreg:1,ft61Ioc:16});assert.throws(()=>validateFt61Vreg(p,package16));
 p.peripherals.ft61Ioc=0;p.peripherals.ft61VregP=32;assert.throws(()=>validateFt61Vreg(p,package16));
});
test('generator disables digital drivers and pulls and preserves unrelated bits',()=>{
 const p=project({ft61Vreg:1,ft61VregRef:2,ft61VregP:15,ft61VregN:31});validateFt61Vreg(p,package16);
 const s=generateFt61Vreg(p,package16).join('\n');assert.match(s,/TRISA \|= \(1u << 4\)/);assert.match(s,/TRISC \|= \(1u << 5\)/);
 assert.match(s,/WPUA &= \(unsigned char\)~\(1u << 4\)/);assert.match(s,/WPD &= \(unsigned char\)~\(1u << 4\)/);
 assert.match(s,/WPUC &= \(unsigned char\)~\(1u << 5\)/);assert.match(s,/VCON1 = \(VCON1 & 0x80u\) \| 0x4F/);
 assert.match(s,/VCON2 = \(VCON2 & 0xE0u\) \| 0x1F/);assert.match(s,/MSCKCON \|= \(1u << 6\)/);
 assert.doesNotMatch(generateFt61Vreg(p,package14).join('\n'),/TRISC|WPUC/);
});
