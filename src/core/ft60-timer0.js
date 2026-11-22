/* FT60E21x Data Sheet Rev 1.01 sections 7.1.3 and 7.2, tables 7-4 and 7-5. */
export const ft60Timer0Defaults = Object.freeze({
  // 0=instruction clock, 1=HIRC, 2=PA2 synchronized to instruction clock,
  // 3=PA2 synchronized to HIRC.
  ft60T0Source: 0,
  // External input edge: 0=rising, 1=falling.
  ft60T0Edge: 0,
  ft60T0Sleep: 0,
  // Watchdog source: 0=LIRC, 1=HIRC. LIRC speed is shared with Timer2.
  ft60WdtClock: 0,
  // -1 assigns the shared scaler to Timer0; 0..7 assign 1:1..1:128 to WDT.
  ft60WdtPost: -1
});

export function validateFT60Timer0(project, device) {
  const p=project.peripherals;
  for (const [key,lo,hi] of [['ft60T0Source',0,3],['ft60T0Edge',0,1],['ft60T0Sleep',0,1],['ft60WdtClock',0,1],['ft60WdtPost',-1,7]]) {
    if (!Number.isInteger(p[key]) || p[key]<lo || p[key]>hi) throw new Error('Invalid setting: '+key);
  }
  if (p.ft60WdtPost>=0 && p.watchdog<0) throw new Error('Watchdog postscaler requires an enabled watchdog.');
  // Existing Timer0 control always selects a prescaler of at least 1:2.
  if (p.ft60WdtPost>=0 && p.timer0>=0) throw new Error('Timer0 and watchdog cannot both use the shared scaler.');
  if (p.timer0>=0 && p.ft60T0Sleep && (p.ft60T0Source===0 || p.ft60T0Source===2))
    throw new Error('Timer0 sleep operation requires HIRC as timer or synchronizer clock.');
  if (p.timer0>=0 && p.ft60T0Source>=2 &&
      (!device.pins.includes('PA2') || !['GPIO input','GPIO input + pull-up'].includes(project.pins.PA2)))
    throw new Error('Timer0 external input requires PA2 as a digital input.');
  return project;
}

const hex=n=>'0x'+n.toString(16).toUpperCase().padStart(2,'0');
export function generateFT60Timer0(project) {
  const p=project.peripherals;
  if(p.timer0<0 && p.watchdog<0) return [];
  const lines=['', '    /* Timer0 and watchdog share a scaler (datasheet section 7.1.3). */'];
  // Do not stop a timer if the configuration only touches the watchdog, except
  // while assigning the shared scalar to WDT, as TMR0 must be cleared there.
  if(p.timer0>=0 || p.ft60WdtPost>=0)lines.push('    T0CON0 &= (unsigned char)~(1u << 3);');
  lines.push('    CLRWDT();');
  if(p.ft60WdtPost>=0){
    lines.push('    TMR0 = 0;', '    OPTION |= (1u << 3);', `    OPTION = (OPTION & 0xF8u) | ${hex(p.ft60WdtPost)};`);
  }else{
    lines.push(`    OPTION = (OPTION & 0xF0u) | ${hex(p.timer0>=0?p.timer0:0)};`);
  }
  if(p.timer0>=0){
    const external=p.ft60T0Source>=2;
    const option=(external?0x20:0)|(external&&p.ft60T0Edge?0x10:0);
    const ctrl=0x08|(p.ft60T0Sleep?0x04:0)|(p.ft60T0Source&1);
    lines.push('    /* Timer0 source, edge and initial count. */',
      `    OPTION = (OPTION & 0xCFu) | ${hex(option)};`,
      '    TMR0 = 0;', `    T0CON0 = ${hex(ctrl)};`);
  }
  if(p.watchdog>=0)lines.push('    /* WDTE is a boot option; preserve LVD polarity. */',
    `    WDTCON = (WDTCON & 0x80u) | ${hex((p.ft60WdtClock<<5)|(p.watchdog<<1)|1)};`);
  return lines;
}
