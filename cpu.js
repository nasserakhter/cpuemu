import chalk from 'chalk';

export const MAX_32_BIT = 2 ** 32;
export const R_OFF = 3;

export const MAGIC = "AEX";
export const MAGIC_SIZE = MAGIC.length;
export const OPCODE_SIZE = 1; // 1 byte
export const REF_SIZE = 1; // 1 byte
export const ARG_SIZE = 4; // each arg is 4 bytes + 1 byte for ref/deref
export const INSTRUCTION_SIZE = OPCODE_SIZE + (2 * (REF_SIZE + ARG_SIZE));

const refArg1 = (registers) => +registers[1].slice(1) + R_OFF;
const refArg2 = (registers) => +registers[2].slice(1) + R_OFF;
const derefArg1 = (registers) => registers[1][0] === "R" ? registers[refArg1(registers)] : +registers[1];
const derefArg2 = (registers) => registers[2][0] === "R" ? registers[refArg2(registers)] : +registers[2];

const MOV = (registers) => registers[refArg2(registers)] = derefArg1(registers);
const ADD = (registers) => registers[refArg1(registers)] = (derefArg1(registers) + derefArg2(registers)) % MAX_32_BIT;
const SUB = (registers) => {
  const k = derefArg1(registers) - derefArg2(registers);
  registers[refArg1(registers)] = k < 0 ? MAX_32_BIT - k : k;
}
const MUL = (registers) => registers[refArg1(registers)] = (derefArg1(registers) * derefArg2(registers)) % MAX_32_BIT;
const DIV = (registers) => registers[refArg1(registers)] = Math.floor(derefArg1(registers) / derefArg2(registers));
const MOD = (registers) => registers[refArg1(registers)] = derefArg1(registers) % derefArg2(registers);
const DEC = (registers) => {
  const k = derefArg1(registers);
  registers[refArg1(registers)] = k <= 0 ? MAX_32_BIT - 1 : k - 1;
}
const INC = (registers) => {
  const k = derefArg1(registers);
  registers[refArg1(registers)] = k >= MAX_32_BIT - 1 ? 0 : k + 1;
}
const INV = (registers) => registers[refArg1(registers)] = ~derefArg1(registers) >>> 0;
const JMP = (registers) => registers[0] = derefArg1(registers) - 1;
const JZ = (registers) => registers[R_OFF] === 0 && (registers[0] = derefArg1(registers) - 1);

const opcodes = [MOV, ADD, SUB, MUL, DIV, MOD, DEC, INC, INV, JMP, JZ];
export const opcodesKeys = opcodes.map(x => x.name).reduce((a, c, i) => (a[c] = i, a), {});

function hex(num = 0) {
  return `0x${num.toString(16).toUpperCase()}`;
}

function realLength(str) {
  return str.replace(/\x1B\[[0-9;]*?m(?:DA)*/g, "").length;
}

function write(text) {
  process.stdout.write(text);
}

function table(options, ...items) {
  options.min = options.min ?? 1;
  const spacing = Math.max(...items.map(x => realLength(x))) + options.min;
  let buffer = "";
  console.log(spacing);
  items.forEach(x => buffer += x + ' '.repeat(spacing - realLength(x)));
  process.stdout.write(buffer);
  if (options.newLine) process.stdout.write('\n');
}

async function readKey() {
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise(resolve => process.stdin.once('data', data => {
    process.stdin.setRawMode(false);
    process.stdin.pause();
    const key = data.toString();
    if (key === '\x03') process.exit();
    resolve(key);
  }));
}

export async function exec(exe, options) {
  const debug = options.debug ?? false;
  const step = options.step ?? false;

  if (exe.slice(0, MAGIC_SIZE).toString() !== MAGIC) throw new Error("Invalid executable");
  exe = exe.slice(MAGIC_SIZE);

  const il = exe.length / INSTRUCTION_SIZE;
  const registers = [0, '', '', ...new Array(43).fill(0)];

  while (registers[0] < il) {
    let offset = registers[0] * INSTRUCTION_SIZE;
    const opcode = exe.readUint8(offset);
    offset += OPCODE_SIZE;

    const aIsRegister = exe.readUint8(offset) === 0xFF;
    offset += REF_SIZE;
    const a = (aIsRegister ? 'R' : '') + exe.readUint32LE(offset);
    offset += ARG_SIZE;

    const bIsRegister = exe.readUint8(offset) === 0xFF;
    offset += REF_SIZE;
    const b = (bIsRegister ? 'R' : '') + exe.readUint32LE(offset);
    offset += ARG_SIZE;

    const IP = registers[0];

    let before;

    if (debug) {
      if (step) {
        write(`|${chalk.bgYellow.black(hex(registers[0]))}   | `);
        write(
          `${chalk.bgGreen.black(hex(opcode))} `
        );
        write(
          chalk.yellow(opcodes[opcode].name.padEnd(4, ' ')) + ' ' +
          chalk.magenta((a ?? '0').padEnd(3, ' ')) + ' ' +
          chalk.magenta((b ?? '0').padEnd(3, ' ')) + '\n'
        );

        const key = await readKey();
        write('\x1B[1A\x1B[1000D');
      }

      write(`|${chalk.bgBlue.black(hex(registers[0]))}   | `);
      write(
        `${chalk.bgGreen.black(hex(opcode))} `
      );
      write(
        chalk.yellow(opcodes[opcode].name.padEnd(4, ' ')) + ' ' +
        chalk.magenta((a ?? '0').padEnd(3, ' ')) + ' ' +
        chalk.magenta((b ?? '0').padEnd(3, ' ')) + ' '
      );


      before = registers.slice(3);
    }

    registers[1] = a;
    registers[2] = b;
    opcodes[opcode](registers);

    if (debug) {
      const after = registers.slice(3)
        .map((x, i) => [`R${i.toString().padStart(2, 0)}: ${x}`, x, i])
        .filter((x, i) => x[1] !== before[i])
        .map(x => `R${x[2].toString().padStart(2, 0)}:${before[x[2]]} -> ${x[0]}`);

      console.log(
        after.join(' ')
      )
    }

    if (IP === registers[0]) registers[0]++;
    else if (debug) console.log(`|${chalk.bgGray.black('JUMP \u21A9')}|${chalk.bgGray.black('\u21A9 '.repeat(15))}`);
  }
  const returnValue = hex(registers[R_OFF + 42]);
  if (debug) {
    console.log('-'.repeat(25));
    console.log(`${chalk.bgRed("RETURN:")} ${chalk.red(returnValue)} (${chalk.gray(registers[R_OFF + 42])})`);
  } else {
    console.log(returnValue);
    console.log(registers[R_OFF + 42]);
  }
}