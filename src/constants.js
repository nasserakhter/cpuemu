export const MAX_32_BIT = 2 ** 32;

/*
  INSTRUCTION FORMAT
*/

// aex executable format
export const MAGIC = "AEX";
export const MAGIC_SIZE = MAGIC.length;
export const OPCODE_SIZE = 1; // 1 byte
export const REF_SIZE = 1; // 1 byte
export const REFS = {
  IMMEDIATE: 1,
  // relative is basically for jumps
  RELATIVE: 2,
  RELATIVE_NEGATIVE: 3,
  REGISTER: 4,
  ADDRESS: 5,
  ADDRESS_AT_REGISTER: 6,
}
export const ARG_SIZE = 4; // each arg is 4 bytes + 1 byte for ref/deref
export const INSTRUCTION_SIZE = OPCODE_SIZE + (2 * (REF_SIZE + ARG_SIZE));


/*
  REGISTERS & MEMORY
*/

// registers
// internal registers:
// 0: Instruction Pointer
// 1: Operand A
// 2: Operand B
export const R_OFF = 3;
export const REGISTERS_COUNT = 6;
export const RETURN_REGISTER = 6;

// interrupts
export const INTERRUPT_MAX = 8; // maximum number of interrupts
export const INTERRUPT_SIZE = 1; // 2 bytes per interrupt, 1 for the interrupt number, 1 for the address
export const INTERRUPT_TABLE_OFFSET = 0x0;
export const INTERRUPT_TABLE_SIZE = INTERRUPT_MAX * INTERRUPT_SIZE;

// memory
export const TOTAL_MEMORY_SIZE = 16; // number of bytes (yes, very small)

/*
  BUS & DEVICES
 */

// chipset
export const CHIPSET_SIZE = 1; // 1 byte
export const CHIPSET_OPERATIONS = {
  SHUTDOWN: 1
};

// GPU
export const GPU_SIZE = 2; // 2 bytes, one for operation, one for data
export const GPU_OPERATIONS = {
  PRINT_CHAR: 1
};

/*
  RUNTIME
*/

// flags
export const FLAGS = {
  PROTECTED_MEMORY: 0b1,
}