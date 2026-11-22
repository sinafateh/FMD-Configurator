import test from 'node:test';
import assert from 'node:assert/strict';
import {devices} from '../src/data/devices.js';
import {generateFt61Gpio, validateFt61Gpio} from '../src/core/ft61-gpio.js';
const device = devices.find(d => d.id === 'FT61EC23');
function p() { return {pins: {}, peripherals:{ft61Ioc:0, ft61Edge:0}}; }

test('FT61 pull-up ports and four pull-down mappings are independent', () => {
 const x=p();x.pins={PA1:'GPIO input + pull-up',PC0:'GPIO input + pull-up',PA4:'GPIO input + pull-down',PC1:'GPIO input + pull-down',PC2:'GPIO input + pull-down',PC3:'GPIO input + pull-down'};
 validateFt61Gpio(x,device);const c=generateFt61Gpio(x).join('\n');
 assert.match(c,/WPUA = 0x02/);assert.match(c,/WPUC = 0x01/);assert.match(c,/WPD = 0x1E/);assert.match(c,/OPTION &= \(unsigned char\)~\(1u << 7\)/);
 x.pins={PA0:'GPIO input + pull-down'};assert.throws(()=>validateFt61Gpio(x,device));
});
test('FT61 external and port-change interrupts validate pins and generate flags',()=>{
 const x=p();x.pins={PA0:'GPIO input + pull-up',PC1:'GPIO input'};x.peripherals.ft61Ioc=1;x.peripherals.ft61Edge=2;validateFt61Gpio(x,device);const c=generateFt61Gpio(x).join('\n');
 for(const str of ['IOCA = 0x01;', '(void)PORTA;', 'PAIF = 0;', 'PAIE = 1;', 'INTF = 0;', 'INTE = 1;']) assert.ok(c.includes(str));
 assert.match(c,/CMCON0 = \(CMCON0 & 0xF8u\) \| 0x07u/);assert.match(c,/OPTION &= \(unsigned char\)~\(1u << 6\)/);
 x.pins.PC1='GPIO output';assert.throws(()=>validateFt61Gpio(x,device));
 x.pins.PC1='GPIO input';assert.throws(()=>validateFt61Gpio(x,devices.find(d=>d.id==='FT61EC21A')));
});
