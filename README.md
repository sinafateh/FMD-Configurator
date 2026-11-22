# FMD Configurator

A browser-based configuration and C code generation tool for the FMD FT61EC2x microcontroller family. Select a device, configure supported peripherals and pins, and generate a starting point for an FMD compiler project.

## Getting started

Python 3 and a modern browser are required. On Windows, run `run.bat`, then open `http://localhost:8000`. Alternatively, from the project directory run:

```sh
python -m http.server 8000
```

Open `http://localhost:8000` in a browser. No third-party packages are required to run the application.

## Features

- Device and package selection with a persistent pinout view and pin assignments.
- Configuration for internal clock, GPIO, ADC, timers, PWM duty cycle, watchdog, low-voltage detector, and selected interrupts.
- C code generation with `FMD_Init()`, a `main()` function, and empty application setup and loop sections.
- Save and load project configurations; light and dark themes.

Supported options depend on the selected device and package. Peripheral support is partial: consult the datasheet and generated code for the supported modes. Configuration bits, some peripheral modes, and other device features are not fully implemented. Representative configurations have been compiled, but hardware testing has not been performed.

## Tests

Install Node.js, then run:

```sh
npm test
```

For the optional compiler smoke tests, install the FMD compiler and run:

```sh
npm run test:compiler
```

The compiler test defaults to the locally installed FMD GCC8 path. Set `FMD_COMPILER` to the compiler executable if it is installed elsewhere. The compiler and its headers are not included. Test builds do not set programming configuration bits and are not ready to flash.

## Project structure

- `index.html`: application shell.
- `src/data/`: device and package metadata.
- `src/core/`: configuration model, capabilities, and code generation.
- `src/ui/`: styles.
- `src/main.js`: interface and event handling.
- `tests/`: model tests and compiler smoke tests.
- `docs/`: source notes.

## Third-party materials

The FT61EC2x datasheet and FMD compiler are separate third-party materials. Local reference copies of vendor headers and the extracted datasheet text are excluded from Git because their redistribution terms have not been established. See `docs/SOURCE.md` for source notes.
