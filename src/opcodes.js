import { pop, push } from "../devices/stack.js";
import { FLAGS, INSTRUCTION_SIZE, INTERRUPT_SIZE, INTERRUPT_TABLE_OFFSET, MAX_32_BIT, REGISTERS_COUNT, R_OFF } from "./constants.js";

const setAtArg = (arg, value, fromRegister = true) => {
  if (registers[arg][0] === "R") {
    const rI = +registers[arg].slice(1) + R_OFF;
    registers[rI] = value;
  } else if (registers[arg][0] === "@") {
    const mI = getAtArg(registers[arg].slice(1), false);
    bus[mI] = value;
  } else {
    throw new Error(`Invalid operand, unexpected integer literal`);
  }
}

const getAtArg = (arg, fromRegister = true) => {
  //if (typeof registers[arg] === 'number' return arg;
  if (arg[0] === "R") {
    const rI = +arg.slice(1) + R_OFF;
    const regVal = registers[rI];
    if (regVal === undefined) throw new Error(`Segmentation fault: register is out of bounds`);
    return regVal;
  } else if (arg[0] === "@") {
    const mI = getAtArg(arg.slice(1), false);
    return bus[mI];
  } else if (arg[0] === "+") {
    return registers[0] + (+arg.slice(1) * INSTRUCTION_SIZE);
  } else if (arg[0] === "-") {
    return registers[0] - (+arg.slice(1) * INSTRUCTION_SIZE);
  } else {
    return +arg;
  }
}

const getAtArg1 = (fromRegister = true) => getAtArg(registers[1], fromRegister);
const getAtArg2 = (fromRegister = true) => getAtArg(registers[2], fromRegister);

const setAtArg1 = (value, fromRegister = true) => setAtArg(1, value, fromRegister);
const setAtArg2 = (value, fromRegister = true) => setAtArg(2, value, fromRegister);

// Move value (arg2) to register or memory (arg1)
const MOV = () => setAtArg1(getAtArg2());
// Add value (arg2) to register or memory (arg1)
const ADD = () => setAtArg1((getAtArg1() + getAtArg2()) % MAX_32_BIT);
// Subtract value (arg2) from register or memory (arg1)
const SUB = () => {
  const k = getAtArg1() - getAtArg2();
  setAtArg1(k < 0 ? MAX_32_BIT - k : k);
}
// Multiply value (arg2) with register or memory (arg1)
const MUL = () => setAtArg1((getAtArg1() * getAtArg2()) % MAX_32_BIT);
// Divide register or memory (arg1) by value (arg2)
const DIV = () => setAtArg1(Math.floor(getAtArg1() / getAtArg2()));
// Modulo register or memory (arg1) by value (arg2)
const MOD = () => setAtArg1(getAtArg1() % getAtArg2());
// Decrement register or memory (arg1) by 1
const DEC = () => {
  const k = getAtArg1();
  setAtArg1(k <= 0 ? MAX_32_BIT - 1 : k - 1);
}
// Increment register or memory (arg1) by 1
const INC = () => {
  const k = getAtArg1();
  setAtArg1(k >= MAX_32_BIT - 1 ? 0 : k + 1);
}
// Invert register or memory (arg1)
const INV = () => setAtArg1(~getAtArg1() >>> 0);
// Jump to address (arg1)
const JMP = () => registers[0] = getAtArg1();
// Fire interrupt (arg1)
const INT = () => {
  global.instructionFlagsOld = global.instructionFlags;
  global.instructionFlags = FLAGS.PROTECTED_MEMORY;
  push(registers[0] + INSTRUCTION_SIZE); // Push return address
  for (let i = 1; i < REGISTERS_COUNT; i++) push(registers[i]); // Push registers
  registers[0] = bus[INTERRUPT_TABLE_OFFSET + getAtArg1() * INTERRUPT_SIZE];
}
// Jump to address (arg1) if register (arg2) is zero
const JZ = () => registers[R_OFF] === 0 && JMP();
// No operation
const NOP = () => { };
// Halt
const HLT = () => { };
// Gets the address of the instruction at register 0 by offset (arg1)
const ADR = () => registers[R_OFF] = getAtArg1();
// Returns from the interrupt and restores the registers
const IRET = () => {
  global.instructionFlags = global.instructionFlagsOld;
  for (let i = 1; i < REGISTERS_COUNT; i++)
    registers[i] = pop();
  registers[0] = pop();
}
// Push a value (arg1) to the stack
const PUSH = () => push(getAtArg1());
// Pop a value from the stack to register or memory (arg1)
const POP = () => setAtArg1(pop());
// Call a function at address (arg1)
const CALL = () => {
  push(registers[0] + INSTRUCTION_SIZE); // Push return address
  registers[0] = getAtArg1();
}
// Return from a function
const RET = () => registers[0] = pop();

export const opcodes = [
  MOV, ADD, SUB, MUL, DIV, MOD,
  DEC, INC, INV, JMP, INT, JZ,
  NOP, HLT, ADR, IRET, PUSH, POP,
  CALL, RET
];
export const opcodesKeys = opcodes.map(x => x.name).reduce((a, c, i) => (a[c] = i, a), {});