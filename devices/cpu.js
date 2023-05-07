import chalk from 'chalk';
import { opcodes, opcodesKeys } from '../src/opcodes.js';
import { captureSnapshot, debugActions, diffSnapshot, hasCliFlag, hex, printInstructions, protectedMemCheck, readKey, refTransform } from '../src/utils.js';
import {
  ARG_SIZE,
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

    await printInstructions(a, b, opcode);

    protectedMemCheck(a);
    protectedMemCheck(b);

    const IP = registers[0];
    if (step) await debugActions(await readKey());

    const beforeSnapshot = await captureSnapshot(a, b, opcode);
    if (opcode === HALT_OPCODE) {
      if (debug) console.log();
      break;
    }

    registers[1] = a;
    registers[2] = b;

    if (!opcodes[opcode]) throw new Error(`Invalid opcode`);
    opcodes[opcode](registers);

    const afterSnapshot = await captureSnapshot(a, b, opcode);
    await diffSnapshot(a, b, beforeSnapshot, afterSnapshot);

    if (IP === registers[0]) registers[0] += INSTRUCTION_SIZE;
    else {
      if (debug) {
        if (opcode === opcodesKeys['INT']) {
          console.log(`|${chalk.bgYellow.black('INTER :')}|${chalk.bgYellow.black('::'.repeat(15))}`)
        } else {
          console.log(`|${chalk.bgGray.black('JUMP  \u21A9')}|${chalk.bgGray.black('\u21A9 '.repeat(15))}`)
        }
      };
    }
  }
  const returnValue = hex(registers[R_OFF + RETURN_REGISTER]);
  if (debug) {
    console.log('-'.repeat(25));
    let newNum = returnValue;
    let strBuffer = '';
    while (newNum > 0) {
      const charCode = newNum & 255;
      strBuffer = String.fromCharCode(charCode >= 32 && charCode <= 126 ? charCode : 46) + strBuffer;
      newNum >>>= 8
    }
    console.log(`${chalk.bgRed("RETURN:")} ${chalk.red(returnValue)} (${chalk.yellow(registers[R_OFF + RETURN_REGISTER])}) "${chalk.blue(strBuffer)}"`);
  } else if (printReturn) {
    console.log(returnValue);
    console.log(registers[R_OFF + RETURN_REGISTER]);
  }
}