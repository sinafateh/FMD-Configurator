# Datasheet implementation checklist

This checklist tracks configurable features of the FT60E21x and FT61EC2x datasheets, Rev 1.01. A checked item has model, UI and generated-code support plus automated checks; it does not imply on-device validation. Unchecked items are missing, incomplete, or need verification. Work proceeds from the first unchecked item, respecting dependencies and package pin availability.

## FT60E21x

- [x] GPIO: digital input, output and per-pin weak pull-up; compile smoke test.
- [x] GPIO: source/sink current settings for PA4 and PA5, with package validation and compiler smoke test.
- [ ] GPIO: PORTA interrupt-on-change pin selection and flag setup. Local source configured; GIE remains off until an ISR is installed.
- [ ] GPIO: PA2 rising/falling edge interrupt and flag setup. Local source configured; GIE remains off until an ISR is installed.
- [ ] GPIO interrupts: validate sleep wake-up and ISR behavior on hardware.
- [ ] System clocks: external clock, boot selection, output clock, calibration and cross-calibration.
- [ ] Reset and boot: MCLR, brown-out levels, power-up and reset configuration bits, reset cause.
- [x] Timer0: external counter, HIRC source, sleep operation and shared-scaler selection; unit and compiler smoke tests.
- [x] Timer2: independently configurable 16-bit period when PWM is unused.
- [x] Timer2: postscaler selection from 1:1 to 1:16.
- [x] Timer2: instruction, 4x instruction, HIRC and 32 kHz LIRC clock selection.
- [x] Timer2: sleep operation selection for eligible clock sources.
- [x] Timer2: shared 32/256 kHz LIRC selection for Timer2 and watchdog, with compile test.
- [x] Watchdog: HIRC/LIRC selection and shared postscaler with safe switching; unit and compiler smoke tests.
- [ ] Watchdog: WDTE boot-level configuration and hardware validation.
- [ ] PWM: complementary output, alternate output routing, independent secondary fault output states and XOR/XNOR.
- [ ] PWM: complete validation of break input, fault timing, output polarity, one-pulse and buzzer interactions.
- [ ] LVD: complete validation of external input / MCLR configuration, comparator behavior and PWM interactions.
- [ ] EEPROM: read/write helpers, flags, interrupts and data integrity handling.
- [ ] Sleep and wake-up sources; interrupt setup and user ISR template.
- [ ] Boot-level programming options and read/write protection export in the supported FMD toolchain.
- [ ] Hardware verification for every supported mode and package.

## FT61EC2x

- [x] GPIO: per-pin pull-up and supported pull-down pins; unit and compiler smoke tests.
- [ ] GPIO: interrupt-on-change and external interrupt sources configured, but global interrupts remain off pending an application ISR. Validate PC1 analog-multiplex detail on hardware.
- [ ] System clocks: external EC/LP/XT, boot settings, fail detection and calibration.
- [ ] Reset and boot: MCLR, brown-out levels, power-up settings and reset cause.
- [ ] Timer0: all clock sources, external counter, prescaler and sleep options.
- [ ] Timer1: external/internal clocks, gating, prescaler and interrupt options.
- [ ] Timer2: period and postscaler, clock sources and interrupt options.
- [ ] Timer3/4/5 and PWM3/4/5: full timer width, clock, prescaler/postscaler, period, duty, polarity, buzzer and sleep options.
- [ ] Watchdog: all clock/scaler and boot options and safe shared-prescaler switching.
- [ ] ECCP: capture, compare, PWM, half/full bridge, complementary outputs, deadband, fault shutdown and restart.
- [ ] ADC: external reference, clock, hardware trigger, acquisition configuration and interrupt options.
- [ ] Comparators: inputs, reference levels, outputs, interrupts and Timer1 gate.
- [ ] Voltage regulators: both outputs and levels, pin conflicts.
- [ ] LVD: all supported controls, flags, inputs and interrupt behavior.
- [ ] EEPROM: read/write helpers, auto-erase, interrupts and protection.
- [ ] Sleep and wake-up sources; all interrupt sources and user ISR template.
- [ ] Boot-level programming options and read/write protection export in the supported FMD toolchain.
- [ ] Hardware verification for every supported mode and package.

## Cross-family quality

- [ ] Audit every datasheet register and boot-level option against the interface, generator and this checklist.
- [ ] Validate pin ownership, peripheral interactions and clock dependencies for all combinations.
- [ ] Compile representative configurations for every peripheral and device family.
- [ ] Verify saved-project migration and UI behavior for family and package changes.

