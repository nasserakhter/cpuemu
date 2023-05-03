import chalk from 'chalk';
import { opcodes } from './opcodes.js';
import { hex, protectedMemCheck, readKey, write } from './utils.js';
import {
  ARG_SIZE,
  INSTRUCTION_SIZE,
  MAGIC,
  MAGIC_SIZE,
  OPCODE_SIZE,
  REFS,
  REF_SIZE,
  REGISTERS_COUNT,
  RETURN_REGISTER,
  R_OFF,
  TOTAL_MEMORY_SIZE
} from './constants.js';

import './bus.js';

// registers and memory
globalThis.registers = Buffer.alloc(0);
globalThis.instructionFlags = 0;

export async function exec(aex, options) {
  const debug = options.debug ?? false;
  const step = options.step ?? false;

  if (aex.slice(0, MAGIC_SIZE).toString() !== MAGIC) throw new Error("Invalid executable");
  aex = aex.slice(MAGIC_SIZE);

  // setup CPU internals
  registers = [0, '', '', ...new Array(REGISTERS_COUNT + 1).fill(0)];
  busBuffers.push(new Array(TOTAL_MEMORY_SIZE + 1).fill(0));

  registers = Buffer.alloc(4 + REGISTERS_COUNT);
  registers.write

  const il = aex.length / INSTRUCTION_SIZE;

  while (registers[0] < il) {
    let offset = registers[0] * INSTRUCTION_SIZE;
    const opcode = aex.readUint8(offset);
    offset += OPCODE_SIZE;

    const aRef = aex.readUint8(offset);
    offset += REF_SIZE;
    let a = aex.readUint32LE(offset).toString();
    offset += ARG_SIZE;

    const bRef = aex.readUint8(offset);
    offset += REF_SIZE;
    let b = aex.readUint32LE(offset).toString();
    offset += ARG_SIZE;

    if (aRef === REFS.REGISTER) a = `R${a}`;
    if (aRef === REFS.ADDRESS) {
      protectedMemCheck(a);
      a = `@${a}`;
    }

    if (bRef === REFS.REGISTER) b = `R${b}`;
    if (bRef === REFS.ADDRESS) {
      protectedMemCheck(b);
      b = `@${b}`;
    }

    const IP = registers[0];


    let regABefore;
    let memABefore;

    if (debug) {
      regABefore = a[0] === 'R' ? registers[+a.slice(1) + R_OFF] : 0;
      memABefore = a[0] === '@' ? bus[+a.slice(1)] : 0;

      if (step) await readKey();

      write(`|${chalk.bgBlue.black(hex(registers[0]))}   | `);
      write(`${chalk.bgGreen.black(hex(opcode))} `);
      write(
        chalk.yellow(opcodes[opcode].name.padEnd(4, ' ')) + ' ' +
        chalk.magenta((a ?? '0').padEnd(3, ' ')) + ' ' +
        chalk.magenta((b ?? '0').padEnd(3, ' ')) + ' '
      );
    }

    registers[1] = a;
    registers[2] = b;
    opcodes[opcode](registers);

    if (debug) {
      const regAAfter = a[0] === 'R' ? registers[+a.slice(1) + R_OFF] : 0;
      const memAAfter = a[0] === '@' ? bus[+a.slice(1)] : 0;

      if (memAAfter !== memABefore) {
        write(chalk.green(`${(hex(+a.slice(1)))}: ${memABefore} -> ${memAAfter}`));
      }

      if (regAAfter !== regABefore) {
        write(chalk.cyan(`R${(+a.slice(1))}: ${regABefore} -> ${regAAfter}`));
      }

      console.log();
    }

    if (IP === registers[0]) registers[0]++;
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