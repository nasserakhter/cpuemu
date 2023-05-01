import chalk from 'chalk';

const MAX_32_BIT = 2 ** 32;
const R_OFF = 3;

const refArg1 = (registers) => +registers[1].slice(1) + R_OFF;
const refArg2 = (registers) => +registers[2].slice(1) + R_OFF;
const derefArg1 = (registers) => registers[1][0] === "R" ? registers[refArg1(registers)] : +registers[1];
const derefArg2 = (registers) => registers[2][0] === "R" ? registers[refArg2(registers)] : +registers[2];

const MOV = (registers) => registers[refArg2(registers)] = derefArg1(registers);
const ADD = (registers) => registers[refArg1(registers)] = (derefArg1(registers) + derefArg2(registers)) % MAX_32_BIT;
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

const opcodes = [MOV, ADD, DEC, INC, INV, JMP, JZ];
const opcodesKeys = opcodes.map(x => x.name).reduce((a, c, i) => (a[c] = i, a), {});

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

function exec(exe, asm) {
  const il = exe.length / 3;
  const registers = [0, '', '', ...new Array(43).fill(0)];

  while (registers[0] < il) {
    const mip = registers[0] * 3;
    const [opcode, a, b] = exe.slice(mip, mip + 3);
    const IP = registers[0];

    write(`|${chalk.bgBlue.black(hex(registers[0]))}   | `);
    write(
      `${chalk.bgGreen.black(hex(opcode))} `
    );
    write(
      chalk.yellow(opcodes[opcode].name.padEnd(4, ' ')) + ' ' +
      chalk.magenta((a ?? '0').padEnd(3, ' ')) + ' ' +
      chalk.magenta((b ?? '0').padEnd(3, ' '))
    );

    const before = registers.slice(3);

    registers[1] = a;
    registers[2] = b;
    opcodes[opcode](registers);

    const after = registers.slice(3).map((x,i) => [`R${i.toString().padStart(2,0)}: ${x}`,x]).filter((x, i) => x[1] !== before[i])
      .map(x => x[0]);

    console.log(
      after.join(' ')
    )

    if (IP === registers[0]) registers[0]++;
    else console.log(`|${chalk.bgGray.black('JUMP \u21A9')}|`);
  }
  console.log('-'.repeat(25));
  const returnValue = hex(registers[R_OFF + 42]);
  console.log(`${chalk.bgRed("RETURN:")} ${chalk.red(returnValue)}`);
}

function assemble(asm) {
  const exe = [];
  asm.forEach(i => {
    const [asmOpcode, operands] = i.split(' ');
    const [a, b] = operands?.split(',') ?? [0, 0];
    if (asmOpcode === 'NOP') return;
    const opcode = opcodesKeys[asmOpcode];
    exe.push(opcode);
    exe.push(a, b);
  });
  return exe;
}

const asm = [
  "MOV 10,R00",
  "MOV 0,R01",
  "JZ 7",
  "DEC R00",
  "INC R01",
  "JMP 3",
  "MOV R01,R42"
]

const exe = assemble(asm);

// debug mode
exec(exe, asm);