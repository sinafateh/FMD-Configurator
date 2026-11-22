// FT61EC2x Data Sheet Rev 1.01, Tables 12-1 to 12-3, sections 12.1 and 12.4.
// Compare-mode hardware triggering requires separate ECCP configuration and is not implemented here.
export const ft61AdcDefaults = Object.freeze({ft61AdcDivs: 0, ft61AdcClock: 6, ft61AdcFormat: 1, ft61AdcFirst: -1});
export const FT61_ADC_PINS = Object.freeze({PA0:0, PA1:1, PA2:2, PA3:3, PC0:4, PC1:5, PC2:6});
const h = n => '0x' + n.toString(16).toUpperCase().padStart(2,'0');
export function selectedFt61AdcPins(project) {
 return Object.entries(project.pins).filter(([pin,fn]) => FT61_ADC_PINS[pin] !== undefined && fn === 'AN'+FT61_ADC_PINS[pin]);
}
/** Device is a package metadata object from devices.js. */
export function validateFt61Adc(project, device) {
 const {adcRef, ft61AdcDivs, ft61AdcClock, ft61AdcFormat, ft61AdcFirst} = project.peripherals;
 if (![0,1,2,3].includes(adcRef) || ![0,1].includes(ft61AdcDivs) || ![0,1,2,3,4,5,6,7].includes(ft61AdcClock) || ![0,1].includes(ft61AdcFormat) || !Number.isInteger(ft61AdcFirst) || ft61AdcFirst < -1 || ft61AdcFirst > 7) throw new Error('Invalid FT61 ADC setting.');
 if (adcRef !== 3 && project.pins.PC0 === 'ADC VREF') throw new Error('ADC VREF requires the external reference setting.');
 if (adcRef === 3 && (!device.pins.includes('PC0') || project.pins.PC0 !== 'ADC VREF')) throw new Error('External ADC reference requires PC0 as ADC VREF.');
 if (ft61AdcFirst >= 0 && ft61AdcFirst <= 6 && !selectedFt61AdcPins(project).some(([,fn]) => fn === 'AN'+ft61AdcFirst)) throw new Error('ADC initial channel must be selected.');
}
/** Return initialization statements for selected pins and initial channel. */
export function generateFt61Adc(project) {
 const p = project.peripherals;
 const pins = selectedFt61AdcPins(project);
 const channel = p.ft61AdcFirst === -1 ? (pins.length ? Number(pins[0][1].slice(2)) : -1) : p.ft61AdcFirst;
 if (channel === -1) return p.adcRef === 3 ? ['', '    /* Configure PC0 as external ADC reference input. */', '    TRISC |= (1u << 0);', '    ANSEL |= (1u << 4);'] : [];
 const lines = ['', '    /* Configure ADC while disabled. */', '    ADCON0 &= (unsigned char)~1u;'];
 for (const [pin,fn] of pins) {
  const bit=Number(pin[2]), channel=Number(fn.slice(2));
  lines.push(`    TRIS${pin[1]} |= (1u << ${bit});`, `    ANSEL |= (1u << ${channel});`);
 }
 if (p.adcRef===3) lines.push('    TRISC |= (1u << 0); /* PC0 / VREF */', '    ANSEL |= (1u << 4);');
 if (channel===7) lines.push('    ANSEL |= (1u << 7); /* internal VDD / 4 channel */');
 lines.push(`    ADCON1 = ${h((p.ft61AdcDivs<<7)|(p.ft61AdcClock<<4))};`,
  `    ADCON0 = ${h((p.ft61AdcFormat<<7)|(p.adcRef<<5)|(channel<<2)|1)};`,
  '    /* Allow reference startup and input acquisition time before conversion. */');
 return lines;
}
