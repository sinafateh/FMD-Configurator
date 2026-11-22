import test from 'node:test';
import assert from 'node:assert/strict';
import {ft60Timer0Defaults,validateFT60Timer0,generateFT60Timer0} from '../src/core/ft60-timer0.js';
const dev={pins:['PA0','PA1','PA2','PA4']};
function project(overrides={}){return {pins:{PA2:'GPIO input'},peripherals:{...ft60Timer0Defaults,timer0:-1,watchdog:-1,...overrides}};}
test('Timer0 HIRC and prescaler setup follows safe shared-scaler sequence',()=>{
  const p=project({timer0:3,watchdog:4,ft60T0Source:1,ft60T0Sleep:1,ft60WdtClock:1});
  validateFT60Timer0(p,dev);const s=generateFT60Timer0(p).join('\n');
  assert.match(s,/CLRWDT\(\);[\s\S]*OPTION = \(OPTION & 0xF0u\) \| 0x03/);
  assert.match(s,/OPTION = \(OPTION & 0xCFu\) \| 0x00/);
  assert.match(s,/T0CON0 = 0x0D/);assert.match(s,/WDTCON = \(WDTCON & 0x80u\) \| 0x29/);
});
test('Timer0 external input with HIRC and falling edge',()=>{
  const p=project({timer0:7,ft60T0Source:3,ft60T0Edge:1,ft60T0Sleep:1});validateFT60Timer0(p,dev);
  const s=generateFT60Timer0(p).join('\n');assert.match(s,/OPTION = \(OPTION & 0xCFu\) \| 0x30/);assert.match(s,/T0CON0 = 0x0D/);
  p.pins.PA2='GPIO output';assert.throws(()=>validateFT60Timer0(p,dev));
});
test('watchdog postscaler uses datasheet transition sequence and rejects conflict',()=>{
  const p=project({watchdog:4,ft60WdtPost:5});validateFT60Timer0(p,dev);const s=generateFT60Timer0(p).join('\n');
  assert.match(s,/CLRWDT\(\);[\s\S]*TMR0 = 0;[\s\S]*OPTION \|= \(1u << 3\);[\s\S]*OPTION = \(OPTION & 0xF8u\) \| 0x05/);
  p.peripherals.timer0=0;assert.throws(()=>validateFT60Timer0(p,dev));
});
test('sleep and watchdog configuration constraints',()=>{
  const p=project({timer0:0,ft60T0Source:2,ft60T0Sleep:1});assert.throws(()=>validateFT60Timer0(p,dev));
  p.peripherals.ft60T0Sleep=0;assert.doesNotThrow(()=>validateFT60Timer0(p,dev));
  p.peripherals.timer0=-1;p.peripherals.ft60WdtPost=0;assert.throws(()=>validateFT60Timer0(p,dev));
});
