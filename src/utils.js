import fs from 'fs';
import { ARG_SIZE, FLAGS, INSTRUCTION_SIZE, MAGIC, MAGIC_SIZE, OPCODE_SIZE, REFS, REF_SIZE, R_OFF } from "./constants.js";
import chalk from 'chalk';
import { opcodes, opcodesKeys } from './opcodes.js';
import { assemble } from './assemble.js';
import { exec } from '../devices/cpu.js';
import path from 'path';

let configJson = {};

if (fs.existsSync('./config.json')) {
  configJson = JSON.parse(fs.readFileSync('./config.json'));
}

export function protectedMemCheck(a) {
  if (instructionFlags & FLAGS.PROTECTED_MEMORY || a[0] !== "@") return;
  a = +a.slice(1);

  Object.values(busProtectedRanges).forEach(([start, end]) => {
    if (a >= start && a <= end) {
      throw new Error(
        "Cannot access protected memory " +
        hex(start) + " -> " + hex(end)
      );
    }
  });
}

export const hasCliFlag = (flag) =>
  !!process.argv.find(i => i === '--' + flag) ||
  configJson[flag] === true;

export async function compileDrivers() {

  const driverAssemblies = fs.readdirSync('./drivers')
    .filter(x => x.endsWith("driver.asm"));

  process.chdir('./drivers');
  const promises = driverAssemblies.map(async (driverAssembly) => {
    const driver = fs.readFileSync(driverAssembly, 'utf8');
    const driverName = driverAssembly.replace('.asm', '');
    const driverBin = await assemble(driver, false);
    const driverBinPath = driverName + '.aex';
    fs.writeFileSync(driverBinPath, driverBin);
    return path.join('drivers', driverBinPath);
  });

  const result = await Promise.all(promises);
  process.chdir('..');
  return result;
}

export function loadBinary(aex, type = 'BINARY') {
  if (aex.slice(0, MAGIC_SIZE).toString() !== MAGIC) throw new Error("Invalid executable");
  aex = aex.slice(MAGIC_SIZE);

  const [codeSegStart, codeSegEnd] = getOpenRange(aex.length + INSTRUCTION_SIZE);

  const HALT = [opcodesKeys['HLT'], REFS.IMMEDIATE,
    0, 0, 0, 0, REFS.IMMEDIATE, 0, 0, 0, 0];

  attachBusDevice([...aex, ...HALT], codeSegStart, codeSegEnd, {
    name: type,
    protected: true
  });

  return [codeSegStart, codeSegEnd];
}

export async function loadDrivers(files) {
  // run each function in sequence
  for (const file of files) {
    const name = path.parse(file).name;
    console.log("Loading driver: " + name);
    const binary = fs.readFileSync(file);
    const [codeSegStart] = loadBinary(binary, name.toLocaleUpperCase() + ' DRIVER');
    registers[0] = codeSegStart;
    await exec();
  }
}

export async function startupChecks() {
  if (hasCliFlag('drivers') && !hasCliFlag('bios')) {
    throw new Error(
      "You specified to load drivers, " +
      "but the bios component is not loaded. " +
      "Enable the bios component whenever using drivers"
    )
  }

  if (hasCliFlag('interrupts') && !hasCliFlag('ram')) {
    console.log(
      "Warning, ideally the interrupt table lives in RAM, " +
      "however, RAM is not currently enabled."
    )
  }

  if (hasCliFlag('bios') && !hasCliFlag('chipset')) {
    console.log(
      "The chipset component is recommended when using the " +
      "bios component as functionality depends on it"
    );
  }
}

export async function refTransform(a, aRef) {
  switch (aRef) {
    case REFS.IMMEDIATE:
      break;
    case REFS.RELATIVE:
      a = `+${a}`;
      break;
    case REFS.RELATIVE_NEGATIVE:
      a = `-${a}`;
      break;
    case REFS.REGISTER:
      a = `R${a}`;
      break;
    case REFS.ADDRESS:
      a = `@${a}`;
      break;
    case REFS.ADDRESS_AT_REGISTER:
      a = `@R${a}`;
      break;
    default:
      throw new Error(`Invalid reference type a:${a} ref:${aRef}`);
  }
  return a.toString();
}


// DEBUG STUFF
export const hex = (num = 0) => `0x${num.toString(16).toUpperCase()}`;

export const write = (text) => process.stdout.write(text);

export async function debugActions(key) {
  switch (key) {
    case 'd':
      console.log("\nGenerating bus dump");
      const fd = await fs.promises.open('./dump.bin', 'w');
      Object.entries(globalThis.ranges).map(([id, [start, end]]) => {
        const buf = Buffer.alloc(end - start);
        for (let i = 0; i < end - start; i++) {
          buf[i] = bus[i + start];
        }
        fd.write(buf, 0, end - start, start);
        console.log('Writing ' + id.replace('#', ' ') + ' to ' + hex(start) + ' -> ' + hex(end));
      });
      fd.close();
      console.log("Bus dump generated");
      break;
  }
}

export async function readKey() {
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

export async function captureSnapshot(a, b) {
  if (debug) {
    const snapshot = {
      registers: {
        a: null,
        b: null,
      },
      bus: {
        a: null,
        b: null,
      }
    };

    snapshot.registers.a = a[0] === 'R' ? registers[+a.slice(1) + R_OFF] : 0;
    snapshot.registers.b = b[0] === 'R' ? registers[+b.slice(1) + R_OFF] : 0;

    snapshot.bus.a = a[0] === '@' ? a[1] === 'R' ? bus[registers[+a.slice(2) + R_OFF]] : bus[+a.slice(1)] : 0;
    snapshot.bus.b = b[0] === '@' ? bus[+b.slice(1)] : 0;

    return snapshot;
  }
  return null;
}

export async function diffSnapshot(a, b, snapshotA, snapshotB) {
  if (debug && snapshotA !== null && snapshotB !== null) {
    if (snapshotA.registers.a !== snapshotB.registers.a) {
      write(chalk.cyan(`R${(+a.slice(1))}: ${snapshotA.registers.a} -> ${snapshotB.registers.a}`));
    }

    if (snapshotA.registers.b !== snapshotB.registers.b) {
      write(chalk.cyan(`R${(+b.slice(1))}: ${snapshotA.registers.b} -> ${snapshotB.registers.b}`));
    }

    if (snapshotA.bus.a !== snapshotB.bus.a) {
      write(chalk.green(`@${(a[1] === 'R' ? registers[+a.slice(2) + R_OFF] : +a.slice(1))}: ${snapshotA.bus.a} -> ${snapshotB.bus.a}`));
    }

    if (snapshotA.bus.b !== snapshotB.bus.b) {
      write(chalk.green(`@${(+b.slice(1))}: ${snapshotA.bus.b} -> ${snapshotB.bus.b}`));
    }

    console.log();
  }
}

export async function printInstructions(a, b, opcode) {
  if (debug) {
    write(`|${chalk.bgBlue.black(hex(registers[0]).padEnd(7))}| `);

    write(`${chalk.bgGreen.black(hex(opcode))} `);
    write(
      chalk.yellow(opcodes[opcode]?.name.padEnd(4, ' ')) + ' ' +
      chalk.magenta((a ?? '0').padEnd(3, ' ')) + ' ' +
      chalk.magenta((b ?? '0').padEnd(3, ' ')) + ' '
    );
  }
}

export function logBuffer(buf) {
  let maxWidth = 11;
  let breakEvery = [];

  const psh = (x) => breakEvery
    .push((breakEvery[breakEvery.length - 1] ?? 0) + x);

  psh(OPCODE_SIZE);
  psh(REF_SIZE);
  psh(ARG_SIZE);
  psh(REF_SIZE);
  psh(ARG_SIZE);

  let width = 0;
  process.stdout.write('0'.repeat(8) + ' ');
  // get rid of magic
  buf = buf.slice(MAGIC_SIZE);

  let lastBroke = 0;
  buf.forEach((byte, i) => {
    process.stdout.write(byte.toString(16).padStart(2, 0) + ' ');
    width++;
    if (width >= maxWidth) {
      process.stdout.write(` |${buf.slice(i - width + 1, i + 1).toString('utf8').replace(/[^\x20-\x7E]/g, '.')}|\n`);
      if (i < buf.length - 1) {
        process.stdout.write(i.toString(16).padStart(8, 0) + ' ');
      }
      width = 0;
      lastBroke = 0;
    } else if (width % breakEvery[lastBroke] === 0) {
      process.stdout.write(' ');
      lastBroke = (lastBroke + 1) % breakEvery.length;
    }
  });
  process.stdout.write('\n');
}