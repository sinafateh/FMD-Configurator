// Optional integration check: FMD_COMPILER must point to gcc8 when not at the default path.
import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {generateEepromHelpers} from '../src/core/eeprom-helpers.js';
const compiler=process.env.FMD_COMPILER||'C:/Program Files (x86)/CCompiler/Compiler/data/bin/gcc8.exe';
if(!existsSync(compiler)){console.error('FMD compiler not found');process.exit(1);}
for(const [family,chip,define] of [['FT60E21x','FT60F21X','_FT60E21X'],['FT61EC2x','FT61F02X','_FT61EC2X']]){
 const dir=resolve('build','eeprom-compiler-check',family);mkdirSync(dir,{recursive:true});
 const source='#include "SYSCFG.h"\n'+generateEepromHelpers(family).join('\n')+'\nunsigned char data;\nvoid main(void){FMD_EEPROM_Write(1,0x55);FMD_EEPROM_Read(1,&data);while(1){}}\n';
 writeFileSync(resolve(dir,'main.c'),source);
 const r=spawnSync(compiler,['--chip='+chip,'-D'+define,'main.c'],{cwd:dir,encoding:'utf8',windowsHide:true});
 if(r.error||r.status!==0)throw new Error(family+' compile failed: '+(r.stderr||r.stdout||r.error));
 const assembly=readFileSync(resolve(dir,'main.as'),'utf8');
 const instructions=assembly.split(/\r?\n/).map(s=>s.trim()).filter(s=>/^(?:movwf|bsf|bcf|movf|movlw|nop|goto|btfsc|btfss)\b/i.test(s));
 const unlock=instructions.findIndex(s=>/^movwf\s+\(156\)\^080h/i.test(s));
 if(unlock<0||!/^bsf\s+\(1256\/8\)\^080h,\(1256\)&7/i.test(instructions[unlock+1]))throw new Error(family+': WR must be the instruction immediately after EECON1 write');
 const read=instructions.findIndex(s=>/^bsf\s+\(1248\/8\)\^080h,\(1248\)&7/i.test(s));
 if(read<0||!/^nop\b/i.test(instructions[read+1]))throw new Error(family+': missing read wait NOP');
 console.log('PASS',family,'compile, immediate write trigger, read wait');
}
