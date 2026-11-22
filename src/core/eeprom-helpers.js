// FT60E21x and FT61EC2x datasheets Rev 1.01, section 11.2 and 11.3.
// Blocking helpers; the caller must not call them from an ISR or invoke them
// concurrently. Nonzero return means arguments were in range and operation ended.
export function generateEepromHelpers(family) {
  if(!['FT60E21x','FT61EC2x'].includes(family))throw new Error('Unsupported EEPROM family.');
  const addressGuard=family==='FT60E21x'?['    if (address >= 0x80u) return 0;']:[];
  return [
    '/* EEPROM access: blocking; do not call from interrupt handlers. */',
    'unsigned char FMD_EEPROM_Read(unsigned char address, unsigned char *value)',
    '{',
    '    unsigned char old_gie;',
    '    if (!value) return 0;',
    ...addressGuard,
    '    old_gie = GIE;',
    '    do { GIE = 0; } while (GIE);',
    '    while (WR) { }',
    '    EEADR = address;',
    '    RD = 1;',
    '    NOP(); /* FT61EC2x requires one instruction after requesting a read. */',
    '    *value = EEDAT;',
    '    if (old_gie) GIE = 1;',
    '    return 1;',
    '}',
    '',
    'unsigned char FMD_EEPROM_Write(unsigned char address, unsigned char value)',
    '{',
    '    unsigned char old_gie;',
    ...addressGuard,
    '    old_gie = GIE;',
    '    do { GIE = 0; } while (GIE);',
    '    while (WR) { }',
    '    EEADR = address;',
    '    EEDAT = value;',
    '    EEIF = 0;',
    '    EECON1 = 0x34; /* WREN3, WREN2 and WREN1 together. */',
    '    WR = 1; /* Must be the next machine instruction. */',
    '    while (WR) { }',
    '    if (old_gie) GIE = 1;',
    '    return 1;',
    '}',
    ''
  ];
}
