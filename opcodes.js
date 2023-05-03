import { MAX_32_BIT, R_OFF } from "./constants.js";

const setAtArg = (arg, value) => { 
  if (registers[arg][0] === "R") {
    const rI = +registers[arg].slice(1) + R_OFF;
    registers[rI] = value;
  } else if (registers[arg][0] === "@") {
    const mI = +registers[arg].slice(1);
    bus[mI] = value;
  } else {
    throw new Error(`Invalid operand, unexpected integer literal`);
  }
}

const getAtArg = (arg) => {
  if (registers[arg][0] === "R") {
    const rI = +registers[arg].slice(1) + R_OFF;
    const regVal = registers[rI];
    if (regVal === undefined) throw new Error(`Segmentation fault: register is out of bounds`);
    return regVal;
  } else if (registers[arg][0] === "@") {
    const mI = +registers[arg].slice(1);
    return bus[mI];
  } else {
    return +registers[arg];
  }
}

const getAtArg1 = () => getAtArg(1);
const getAtArg2 = () => getAtArg(2);

const setAtArg1 = (value) => setAtArg(1, value);
const setAtArg2 = (value) => setAtArg(2, value);


const MOV = () => setAtArg1(getAtArg2());
const ADD = () => setAtArg1((getAtArg1() + getAtArg2()) % MAX_32_BIT);
const SUB = () => {
  const k = getAtArg1() - getAtArg2();
  setAtArg1(k < 0 ? MAX_32_BIT - k : k);
}
const MUL = () => setAtArg1((getAtArg1() * getAtArg2()) % MAX_32_BIT);
const DIV = () => setAtArg1(Math.floor(getAtArg1() / getAtArg2()));
const MOD = () => setAtArg1(getAtArg1() % getAtArg2());
const DEC = () => {
  const k = getAtArg1();
  setAtArg1(k <= 0 ? MAX_32_BIT - 1 : k - 1);
}
const INC = () => {
  const k = getAtArg1();
  setAtArg1(k >= MAX_32_BIT - 1 ? 0 : k + 1);
}
const INV = () => setAtArg1(~getAtArg1() >>> 0);
const JMP = () => registers[0] = getAtArg1() - 1;
const INT = () => registers[0]
const JZ = () => registers[R_OFF] === 0 && (registers[0] = getAtArg1() - 1);
const NOP = () => { };

export const opcodes = [MOV, ADD, SUB, MUL, DIV, MOD, DEC, INC, INV, JMP, JZ, NOP];
export const opcodesKeys = opcodes.map(x => x.name).reduce((a, c, i) => (a[c] = i, a), {});