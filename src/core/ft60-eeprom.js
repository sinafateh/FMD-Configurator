// FT60E21x datasheet Rev 1.01, PDF pages 49-51, Tables 11-1/11-2.
// These are optional blocking application helpers, not boot-configuration fuses.
export const FT60_EEPROM_DEFAULTS = Object.freeze({ ft60EepromHelpers:0 });
export function validateFt60Eeprom(project,device){
  if(!project?.peripherals || device?.family!=='FT60E21x')throw new Error('FT60 EEPROM requires an FT60E21x device.');
  const enabled=project.peripherals.ft60EepromHelpers??0;
  if(enabled!==0&&enabled!==1)throw new Error('Invalid EEPROM helper setting.');
  return enabled;
}
export function generateFt60EepromHelpers(project,device){
  if(!validateFt60Eeprom(project,device))return [];
  return [
    '/* FT60E21x data EEPROM: blocking helpers. The caller must supply valid operating VDD. */',
    '/* Interrupts are held disabled while the EEPROM is accessed; previous GIE is restored. */',
    '/* Read returns 0x100 for an invalid address; valid data is 0x00-0xFF. */',
    'unsigned int FMD_EEPROM_Read(unsigned char address)',
    '{',
    '    unsigned char was_enabled = GIE;',
    '    unsigned int data;',
    '    if (address >= 128u) return 0x100u;',
    '    do { GIE = 0; } while (GIE);',
    '    while (WR) { }',
    '    EEADR = address;',
    '    RD = 1;',
    '    data = EEDAT;',
    '    if (was_enabled) GIE = 1;',
    '    return data;',
    '}',
    '',
    '/* Write returns 1 if verification succeeded; 0 indicates invalid address or mismatch. */',
    'unsigned char FMD_EEPROM_Write(unsigned char address, unsigned char data)',
    '{',
    '    unsigned char was_enabled = GIE;',
    '    unsigned char readback;',
    '    if (address >= 128u) return 0;',
    '    do { GIE = 0; } while (GIE);',
    '    while (WR) { }',
    '    EEADR = address;',
    '    EEDAT = data;',
    '    EEIF = 0;',
    '    EECON1 = 0x34u; /* WREN3, WREN2 and WREN1 simultaneously */',
    '    WR = 1; /* Must immediately follow WREN setting; check compiler output. */',
    '    while (WR) { }',
    '    EEADR = address;',
    '    RD = 1;',
    '    readback = EEDAT;',
    '    if (was_enabled) GIE = 1;',
    '    return readback == data;',
    '}',
    ''
  ];
}
