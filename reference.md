# CPU EMU

## Achitecture
This CPU emulator will emulate a 32-bit architecture with 8 registers.

### Registers
1. EAX - Accumulator
2. EBX - Base
3. ECX - Counter
4. EDX - Data
5. ESI - Source Index
6. EDI - Destination Index
7. EBP - Base Pointer
8. ESP - Stack Pointer

### Instruction Set
This CPU contains a total of 7 instructions.
 - MOV - 0x01 - Move data from one register to another
 - MOV - 0x02 - Move data from immediate value to register
 - ADD - 0x03 - Add data from one register to another
 - ADD - 0x04 - Add data from immediate value to register
 - SUB - 0x05 - Subtract data from one register to another
 - SUB - 0x06 - Subtract data from immediate value to register
 - INC - 0x07 - Increment data in register
 - DEC - 0x08 - Decrement data in register
 - JMP - 0x09 - Jump to address
 - JZ - 0x0A - Jump to address if EAX is zero