import chalk from 'chalk';
import { opcodes, opcodesKeys } from '../src/opcodes.js';
import { captureSnapshot, diffSnapshot, hasCliFlag, hex, printInstructions, readKey, refTransform } from '../src/utils.js';
import {
  ARG_SIZE,
  FLAGS,
  INSTRUCTION_SIZE,
  OPCODE_SIZE,
  REF_SIZE,
  RETURN_REGISTER,
  R_OFF,
} from '../src/constants.js';

import './bus.js';

export async function exec() {
  const HALT_OPCODE = opcodesKeys['HLT'];
  // CPU should run in an infinite while loop
  while (true) {
    const instructionBuffer = Buffer.from(
      bus.slice(registers[0], registers[0] + INSTRUCTION_SIZE)
    );
    let offset = 0;
    
    const opcode = instructionBuffer.readUint8(offset);
    offset += OPCODE_SIZE;

    const aRef = instructionBuffer.readUint8(offset);
    offset += REF_SIZE;
    let a = instructionBuffer.readUint32LE(offset).toString();
    offset += ARG_SIZE;

    const bRef = instructionBuffer.readUint8(offset);
    offset += REF_SIZE;
    let b = instructionBuffer.readUint32LE(offset).toString();
    offset += ARG_SIZE;

    a = await refTransform(a, aRef);
    b = await refTransform(b, bRef);

    const IP = registers[0];


    if (step) await readKey();

    const beforeSnapshot = await captureSnapshot(a, b, opcode);
    await printInstructions(a, b, opcode);
    if (opcode === HALT_OPCODE) {
      console.log();
      break;
    }
    
    registers[1] = a;
    registers[2] = b;

    if (!opcodes[opcode]) throw new Error(`Invalid opcode`);
    opcodes[opcode](registers);
    
    const afterSnapshot = await captureSnapshot(a, b, opcode);
    await diffSnapshot(a, b, beforeSnapshot, afterSnapshot);

    if (IP === registers[0]) registers[0] += INSTRUCTION_SIZE;
    else if (debug) console.log(`|${chalk.bgGray.black('JUMP \u21A9')}|${chalk.bgGray.black('\u21A9 '.repeat(15))}`);
  }
  const returnValue = hex(registers[R_OFF + RETURN_REGISTER]);
  if (debug) {
    console.log('-'.repeat(25));
    console.log(`${chalk.bgRed("RETURN:")} ${chalk.red(returnValue)} (${chalk.gray(registers[R_OFF + RETURN_REGISTER])})`);
  } else {
    console.log(returnValue);
    console.log(registers[R_OFF + RETURN_REGISTER]);
  }
}