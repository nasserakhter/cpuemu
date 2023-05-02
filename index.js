import {
  exec,
  opcodesKeys,
  MAGIC,
  REF_SIZE,
  ARG_SIZE,
  MAGIC_SIZE,
  OPCODE_SIZE,
  INSTRUCTION_SIZE,
} from './cpu.js';

import fs from 'fs';

function preproccess(asm) {
  let lines = asm
    .replace(/\s*;[^\n]*$/gm, '')
    .trim()
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  // replace labels with addresses
  const JMP_REGEX = /JMP\s[a-zA-Z\_]+/gm;

  const labels = lines
    .filter(x => x.match(JMP_REGEX))
    .map(x => x.slice(4).trim())
    .map((x,i) => [x, i]);

  const foundLabels = {};
  
  labels.forEach(jmp => {
    // for each jmp we want to find the label, delete it, and replace it with the address
    if (foundLabels[jmp[0]]) {
      const address = foundLabels[jmp[0]];
      lines[jmp[1]] = `JMP ${address}`;
    } else {
      const labelIndex = lines.findIndex(x => x === (jmp[0] + ":"));
      if (labelIndex > -1) {
        foundLabels[jmp[0]] = labelIndex;
        lines[labelIndex] = `${jmp[0]}: ${labelIndex + 1}`;
        lines = lines.filter((_,i) => i !== labelIndex); // remove the label
      } else {
        throw new Error(`Label not found: ${jmp[0]}`);
      }
    }
  });

  return lines.filter(x => !x.match(/[a-zA-Z\_]\:/gm));
}

function assemble(asm) {
  asm = preproccess(asm);
  const _exe = [];

  const exeSize = INSTRUCTION_SIZE * asm.length;

  const exe = Buffer.alloc(MAGIC_SIZE + exeSize);

  exe.write(MAGIC, 0);
  let offset = MAGIC_SIZE;

  asm.forEach(i => {
    const [asmOpcode, operands] = i.split(' ');
    const [_a, _b] = operands?.split(',') ?? [null, null];
    const a = _a?.trim() ?? '';
    const b = _b?.trim() ?? '';

    if (asmOpcode === 'NOP') return;
    const opcode = opcodesKeys[asmOpcode];
    if (isNaN(opcode)) throw new Error(`Invalid opcode: ${asmOpcode}`);
    exe.writeUint8(opcode, offset);
    offset += OPCODE_SIZE;

    if (a[0] === 'R') {
      exe.writeUint8(0xFF, offset);
      offset += REF_SIZE;

      exe.writeUint32LE(+a.slice(1), offset);
      offset += ARG_SIZE;
    } else {
      exe.writeUint8(0x00, offset);
      offset += REF_SIZE;

      exe.writeUint32LE(+a, offset);
      offset += ARG_SIZE;
    }

    if (b[0] === 'R') {
      exe.writeUint8(0xFF, offset);
      offset += REF_SIZE;

      exe.writeUint32LE(+b.slice(1), offset);
      offset += ARG_SIZE;
    } else {
      exe.writeUint8(0x00, offset);
      offset += REF_SIZE;

      exe.writeUint32LE(+b, offset);
      offset += ARG_SIZE;
    }
  });
  return exe;
}

function logBuffer(buf) {
  let maxWidth = 16;
  let breakEvery = 8;
  let width = 0;
  process.stdout.write('0'.repeat(8) + ' ');
  buf.forEach((byte, i) => {
    process.stdout.write(byte.toString(16).padStart(2, 0) + ' ');
    width++;
    if (width >= maxWidth) {
      process.stdout.write(` |${buf.slice(i - width + 1, i + 1).toString('utf8').replace(/[^\x20-\x7E]/g, '.')}|\n`);
      if (i < buf.length - 1) {
        process.stdout.write(i.toString(16).padStart(8, 0) + ' ');
      }
      width = 0;
    } else if (width % breakEvery === 0) {
      process.stdout.write(' ');
    }
  });
  process.stdout.write('\n');
}

const asm = fs.readFileSync('./program.asm', 'utf8');

if (asm.length === 0) {
  console.log('Invalid assembly');
  process.exit(1);
}

const debug = !!process.argv.find(i => i === '--debug');
const step = !!process.argv.find(i => i === '--step');

if (debug) {
  console.log('Assembling Program...');
  console.log('This may take a few seconds...');
}

const exe = assemble(asm);

if (debug) {
  console.log('Machine Code:');

  logBuffer(exe);
  console.log('\nAttached Debugger', '\n')
}


if (!debug) {
  performance.mark('start');
}
// debug mode
exec(exe, {
  debug,
  step
});

if (!debug) {
  performance.mark('end');
  performance.measure('Execution Time', 'start', 'end');
  const measure = performance.getEntriesByName('Execution Time')[0];
  console.log(`${measure.duration.toFixed(4)}ms`);
}