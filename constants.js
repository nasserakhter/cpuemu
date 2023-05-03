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
  REGISTER: 2,
  ADDRESS: 3,
}
export const ARG_SIZE = 4; // each arg is 4 bytes + 1 byte for ref/deref
export const INSTRUCTION_SIZE = OPCODE_SIZE + (2 * (REF_SIZE + ARG_SIZE));


/*
  REGISTERS & MEMORY
*/

// registers
export const R_OFF = 3;
export const REGISTERS_COUNT = 24;
export const RETURN_REGISTER = 24;

// interrupts
export const INTERRUPT_MAX = 4; // 4 maximum interrupts
export const INTERRUPT_SIZE = 2; // 2 bytes per interrupt, 1 for the interrupt number, 1 for the address
export const INTERRUPT_TABLE_SIZE = INTERRUPT_MAX * INTERRUPT_SIZE;
export const INTERRUPT_TABLE_OFFSET = 0x0;

// memory
export const WORKABLE_MEMORY_SIZE = 32; // 32 bytes (yes, very small)
export const TOTAL_MEMORY_SIZE = INTERRUPT_TABLE_SIZE + WORKABLE_MEMORY_SIZE;


/*
  RUNTIME
*/

// flags
export const FLAGS = {
  PROTECTED_MEMORY: 0b1,
}