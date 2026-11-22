// FT61EC2x Data Sheet Rev 1.01, Tables 2-4, 2-5 and 9-1 through 9-3.
// Helpers operate only on the FT61 family; callers own pin direction and ANSEL.
export const FT61_INPUTS = Object.freeze(['GPIO input', 'GPIO input + pull-up', 'GPIO input + pull-down']);
export const FT61_PULLDOWN_PINS = Object.freeze(['PA4', 'PC1', 'PC2', 'PC3']);
export const ft61GpioDefaults = Object.freeze({ft61Ioc: 0, ft61Edge: 0});

const h = value => '0x' + value.toString(16).toUpperCase().padStart(2, '0');

/** Validate imported or UI settings; call after applying ft61GpioDefaults. */
export function validateFt61Gpio(project, device) {
  const {ft61Ioc, ft61Edge} = project.peripherals;
  if (!Number.isInteger(ft61Ioc) || ft61Ioc < 0 || ft61Ioc > 255 ||
      ![0, 1, 2].includes(ft61Edge)) throw new Error('Invalid FT61 GPIO interrupt settings.');
  for (const [pin, mode] of Object.entries(project.pins)) {
    if (mode === 'GPIO input + pull-down' && !FT61_PULLDOWN_PINS.includes(pin)) {
      throw new Error('Pull-down unavailable on ' + pin);
    }
  }
  for (let i = 0; i < 8; i++) {
    const pin = 'PA' + i;
    if ((ft61Ioc & (1 << i)) && (!device.pins.includes(pin) || !FT61_INPUTS.includes(project.pins[pin]))) {
      throw new Error('Interrupt-on-change requires an available digital input: ' + pin);
    }
  }
  if (ft61Edge && (!device.pins.includes('PC1') || !FT61_INPUTS.includes(project.pins.PC1))) {
    throw new Error('External interrupt requires PC1 as a digital input.');
  }
}

/** Generate after GPIO TRIS/ANSEL setup and before global interrupt enable. */
export function generateFt61Gpio(project) {
  let pullA = 0, pullC = 0, pullDown = 0;
  const downBits = {PA4: 4, PC1: 3, PC2: 2, PC3: 1};
  for (const [pin, mode] of Object.entries(project.pins)) {
    if (mode === 'GPIO input + pull-up') {
      if (pin[1] === 'A') pullA |= 1 << Number(pin[2]);
      if (pin[1] === 'C') pullC |= 1 << Number(pin[2]);
    } else if (mode === 'GPIO input + pull-down') {
      if (!(pin in downBits)) throw new Error('Pull-down unavailable on ' + pin);
      pullDown |= 1 << downBits[pin];
    }
  }
  const lines = ['', '    /* Digital input pull resistors (PORTA pull-up enable is global). */',
    `    WPUA = ${h(pullA)};`, `    WPUC = ${h(pullC)};`, `    WPD = ${h(pullDown)};`,
    `    OPTION ${pullA ? '&= (unsigned char)~' : '|='}(1u << 7);`];
  const {ft61Ioc, ft61Edge} = project.peripherals;
  if (ft61Ioc || ft61Edge) {
    lines.push('', '    /* Select digital input: comparator mode off, before enabling interrupt. */',
      '    CMCON0 = (CMCON0 & 0xF8u) | 0x07u;');
  }
  if (ft61Ioc) {
    lines.push(`    IOCA = ${h(ft61Ioc)};`, '    (void)PORTA; /* establish interrupt-on-change baseline */',
      '    PAIF = 0;', '    PAIE = 1;');
  }
  if (ft61Edge) {
    lines.push(`    OPTION ${ft61Edge === 1 ? '|=' : '&= (unsigned char)~'}(1u << 6);`,
      '    INTF = 0;', '    INTE = 1;');
  }
  // GIE remains untouched; application must provide an ISR before enabling it.
  return lines;
}
