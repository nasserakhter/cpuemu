import fs from 'fs';
import { exec } from './devices/cpu.js';
import { hasCliFlag } from './utils.js';
import { assemble } from './assemble.js';

import {
  REF_SIZE,
  ARG_SIZE,
  MAGIC_SIZE,
  OPCODE_SIZE,
} from './constants.js';

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