import test from 'node:test';
import assert from 'node:assert/strict';
import {createProject} from '../src/core/project.js';
import {devices} from '../src/data/devices.js';
import {generateFt60EepromHelpers,validateFt60Eeprom} from '../src/core/ft60-eeprom.js';
const device=devices.find(x=>x.id==='FT60E211');
function fixture(){const p=createProject();p.device=device.id;return p;}
test('FT60 EEPROM helpers default off and validate setting',()=>{
 const p=fixture();assert.deepEqual(generateFt60EepromHelpers(p,device),[]);p.peripherals.ft60EepromHelpers=2;assert.throws(()=>validateFt60Eeprom(p,device));
});
test('FT60 EEPROM enforces bounds, writes enables together, restores interrupt state and verifies readback',()=>{
 const p=fixture();p.peripherals.ft60EepromHelpers=1;const c=generateFt60EepromHelpers(p,device).join('\n');
 assert.match(c,/address >= 128u/);assert.match(c,/do \{ GIE = 0; \} while \(GIE\);/);assert.match(c,/EECON1 = 0x34u;[^\n]*\n    WR = 1;/);assert.match(c,/while \(WR\) \{ \}/);assert.match(c,/if \(was_enabled\) GIE = 1;/);assert.match(c,/return readback == data;/);
});
