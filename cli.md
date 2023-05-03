## Modes
- \<none\>: Without any flags, the program will be assembled and run with minimal output.
- `--debug`: The program will be assembled and run with debug output.
- `--compile`: The program will be assembled and the output will be written to a file.

## Flags
- `--step`: When used with `--debug`, the program will be paused at each instruction, allowing you to step through the program.
- `--chipset`: This will connect the emulated chipset on the CPU bus and enable systems functionality. This provides some basic features like shutdown, and IO.
- `--chipset-logs`: When used with `--chipset`, this will enable logging of the chipset to the terminal per its interval (warning: very verbose).
- `--unprotect-memory`: This will disable the memory protection on the CPU, allowing you to write to memory that is normally protected. This is useful for testing interrupt functions.