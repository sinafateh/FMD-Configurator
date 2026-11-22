// PWM output pins, FT61EC2x datasheet Table 1-1.
export const PWM_OUTPUTS = Object.freeze([[3, 'PC4'], [4, 'PC3'], [5, 'PC2']]);
export function availablePwm(device) {
  return PWM_OUTPUTS.filter(([, pin]) => device.pins.includes(pin)).map(([number]) => number);
}
