# Source notes

Device information was derived from the user-supplied FT61EC2x Data Sheet, Rev 1.01 (2022-09-21), including the package pinouts and register descriptions. The datasheet is not included in this repository.

The FMD compiler and its device headers are required to compile generated firmware. They are distributed separately and are not part of this repository. The optional compiler tests can use a locally installed compiler; see the README.

Local copies of FMDIDE reference headers and the extracted datasheet text may exist in the working directory. They are excluded from Git because their redistribution terms have not been established.

Generated initialization covers selected modes only. Representative configurations have been compiled with FMD GCC8, but have not been tested on hardware. Review the datasheet, configuration bits and generated code for the target device.
