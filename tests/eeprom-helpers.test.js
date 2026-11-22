import test from 'node:test';
import assert from 'node:assert/strict';
import {generateEepromHelpers} from '../src/core/eeprom-helpers.js';
for(const family of ['FT60E21x','FT61EC2x'])test(`${family} EEPROM helpers preserve GIE and wait for programming`,()=>{
 const s=generateEepromHelpers(family).join('\n');assert.equal((s.match(/old_gie = GIE/g)||[]).length,2);
 assert.equal((s.match(/do \{ GIE = 0; \} while \(GIE\)/g)||[]).length,2);
 assert.equal((s.match(/if \(old_gie\) GIE = 1/g)||[]).length,2);
 assert.match(s,/RD = 1;\n\s*NOP\(\);/);assert.match(s,/EECON1 = 0x34;[^\n]*\n\s*WR = 1;/);
 assert.equal((s.match(/while \(WR\) \{ \}/g)||[]).length,3);
 assert.equal(s.includes('address >= 0x80u'),family==='FT60E21x');
});
test('unknown families are rejected',()=>assert.throws(()=>generateEepromHelpers('unknown')));
