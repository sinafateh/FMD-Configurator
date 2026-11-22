// FT61EC2x Data Sheet Rev 1.01, Table 1-1, Table 2-5 and section 14.
// VREG_OE controls BOTH regulator pins together; there is no per-pin enable.
export const ft61VregDefaults = Object.freeze({ft61Vreg:0, ft61VregRef:0, ft61VregP:0, ft61VregN:0});
export const FT61_VREG_REFERENCES = Object.freeze([2.4,3.6,4.8,5.3]);
export function ft61VregNominal(reference, step) {
  if(!Number.isInteger(reference)||reference<0||reference>3||!Number.isInteger(step)||step<0||step>31)throw new Error('Invalid VREG setting.');
  return FT61_VREG_REFERENCES[reference]*(step+1)/32;
}
export function validateFt61Vreg(project, device) {
  const p=project.peripherals;
  for(const [key,max] of [['ft61Vreg',1],['ft61VregRef',3],['ft61VregP',31],['ft61VregN',31]])
    if(!Number.isInteger(p[key])||p[key]<0||p[key]>max)throw new Error('Invalid setting: '+key);
  if(!p.ft61Vreg)return;
  if(!device.pins.includes('PA4')&&!device.pins.includes('PC5'))throw new Error('Voltage regulator output is unavailable in this package.');
  // Even if the user needs just one output, both bonded regulator pads are claimed.
  for(const pin of ['PA4','PC5'])if(device.pins.includes(pin)&&project.pins[pin])
    throw new Error('Voltage regulator occupies '+pin+'; remove the pin assignment.');
  if((p.ft61Ioc||0)&(1<<4))throw new Error('Voltage regulator conflicts with PA4 interrupt-on-change.');
}
const hex=value=>'0x'+value.toString(16).toUpperCase().padStart(2,'0');
// Call after GPIO and timer setup; preserve other MSCKCON/VCON register bits.
export function generateFt61Vreg(project, device) {
  const p=project.peripherals;
  if(!p.ft61Vreg)return [];
  const lines=['', '    /* VREG: one enable controls both bonded outputs. */',
    '    MSCKCON &= (unsigned char)~(1u << 6);'];
  if(device.pins.includes('PA4'))lines.push('    TRISA |= (1u << 4);', '    WPUA &= (unsigned char)~(1u << 4);', '    WPD &= (unsigned char)~(1u << 4);');
  if(device.pins.includes('PC5'))lines.push('    TRISC |= (1u << 5);', '    WPUC &= (unsigned char)~(1u << 5);');
  lines.push(`    VCON1 = (VCON1 & 0x80u) | ${hex((p.ft61VregRef<<5)|p.ft61VregP)};`,
    `    VCON2 = (VCON2 & 0xE0u) | ${hex(p.ft61VregN)};`,
    '    MSCKCON |= (1u << 6);');
  return lines;
}
