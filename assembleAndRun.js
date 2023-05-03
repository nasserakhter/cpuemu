import fs from 'fs';
import { exec } from './cpu.js';
import { hasCliFlag } from './utils.js';
import { opcodesKeys } from './opcodes.js';

import {
  MAGIC,
  REF_SIZE,
  ARG_SIZE,
  MAGIC_SIZE,
  OPCODE_SIZE,
  INSTRUCTION_SIZE,
  REFS,
} from './constants.js';

function preproccess(asm) {
  let lines = asm
    .replace(/\s*;[^\n]*$/gm, '') // comments
    .trim()
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  // find all labels
  const labels = {};
  let labelsCount = 0;

  lines = lines.filter((line, i) => {
    if (line.match(/^[a-zA-Z\_]+\:$/gm)) {
      labels[line.slice(0, -1)] = i - labelsCount + 1;
      labelsCount++;
      return false;
    }
    return true;
  });

  lines = lines.map((x, i) => {
    if (x.match(/\s[a-zA-Z\_]+$/g)) {
      const [jmp, label] = x.split(' ');
      if (labels[label]) {
        return `${jmp} ${labels[label]}`;
      } else {
        throw new Error(`Invalid label: ${label}`);
      }
    } else {
      return x;
    }
  })

  return lines;
}

function assemble(asm, debug) {
  asm = preproccess(asm);

  if (debug) {
    console.log('\nFinal Assembly:');
    asm.forEach((x, i) => console.log(`${i + 1}| ${x}`));
    console.log();
  }

  const exeSize = INSTRUCTION_SIZE * asm.length;

  const aex = Buffer.alloc(MAGIC_SIZE + exeSize);

  aex.write(MAGIC, 0);
  let offset = MAGIC_SIZE;

  asm.forEach(i => {
    const asmOpcode = i.slice(0, i.indexOf(' ') >>> 0);
    const operands = i.slice(asmOpcode.length + 1);
    if (operands?.indexOf(',') !== operands?.indexOf(', ')) {
      throw new Error(`Invalid syntax, space after comma is required: ${i}`);
    }
    const [_a, _b] = operands?.split(', ') ?? [null, null];
    let a = _a?.trim() ?? '';
    let b = _b?.trim() ?? '';

    //if (asmOpcode === 'NOP') return;
    const opcode = opcodesKeys[asmOpcode];
    if (isNaN(opcode)) throw new Error(`Invalid opcode: ${asmOpcode}`);
    aex.writeUint8(opcode, offset);
    offset += OPCODE_SIZE;

    // operands matching

    if (a[0] === 'R') {
      aex.writeUint8(REFS.REGISTER, offset);
      a = a.slice(1);
    } else if (a[0] === '[' && a[a.length - 1] === ']') {
      aex.writeUint8(REFS.ADDRESS, offset);
      a = a.slice(1, -1);
    } else {
      aex.writeUint8(REFS.IMMEDIATE, offset);
    }

    a = parseInt(a);

    offset += REF_SIZE;
    aex.writeUint32LE(a, offset);
    offset += ARG_SIZE;

    if (b[0] === 'R') {
      aex.writeUint8(REFS.REGISTER, offset);
      b = b.slice(1);
    } else if (b[0] === '[' && b[b.length - 1] === ']') {
      aex.writeUint8(REFS.ADDRESS, offset);
      b = b.slice(1, -1);
    } else {
      aex.writeUint8(REFS.IMMEDIATE, offset);
    }

    b = parseInt(b);

    offset += REF_SIZE;
    aex.writeUint32LE(b, offset);
    offset += ARG_SIZE;

  });
  return aex;
}

function logBuffer(buf) {
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

export async function assembleAndRun() {
  const asm = fs.readFileSync('./program.asm', 'utf8');

  if (asm.length === 0) {
    console.log('Invalid assembly');
    process.exit(1);
  }

  globalThis.debug = hasCliFlag('debug');
  globalThis.step = hasCliFlag('step');
  globalThis.compile = hasCliFlag('compile');


  if (debug) {
    console.log('Assembling Program...');
    console.log('This may take a few seconds...');
  }

  const aex = assemble(asm, debug);

  if (compile) {
    fs.writeFileSync('./out.aex', aex);
    console.log('Compiled to program.aex');
    process.exit(0);
  }

  if (debug) {
    console.log('Machine Code:');

    logBuffer(aex);
    console.log('\nAttached Debugger')

    if (step) {
      console.log('[DEBUGGER PAUSED] Press enter to step by instruction');
    }
  }


  if (!debug) {
    performance.mark('start');
  }
  // debug mode
  await exec(aex);

  if (!debug) {
    performance.mark('end');
    performance.measure('Execution Time', 'start', 'end');
    const measure = performance.getEntriesByName('Execution Time')[0];
    console.log(`${measure.duration.toFixed(4)}ms`);
  }
}