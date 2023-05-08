import fs from 'fs';
import { exec } from '../devices/cpu.js';
import { hasCliFlag, logBuffer } from './utils.js';
import { assemble } from './assemble.js';

import { setup } from './setup.js';
import { generate } from '../drivers/global.js';

export async function assembleAndRun() {
  // generate the global.asm file
  // this file contains some needed functions
  // and resided in the ./drivers folder
  generate();

  const asm = fs.readFileSync('./program.asm', 'utf8');

  
  const debug = hasCliFlag('debug');
  
  if (debug) {
    console.log('Assembling Program...');
    console.log('This may take a few seconds...');
  }
  
  const aex = assemble(asm, debug);
  
  if (hasCliFlag('compile')) {
    fs.writeFileSync('./out.aex', aex);
    console.log('Compiled to program.aex');
    process.exit(0);
  }
  
  if (debug) {
    console.log('Machine Code:');
    
    logBuffer(aex);
    console.log('\nAttached Debugger')
    
    if (hasCliFlag('step')) {
      console.log('[DEBUGGER PAUSED] Press enter to step by instruction');
    }
  }
  
  if (!debug) {
    performance.mark('start');
  }
  
  // debug mode
  const aexReal = await setup(aex);
  await exec(aexReal);

  if (!debug) {
    performance.mark('end');
    performance.measure('Execution Time', 'start', 'end');
    const measure = performance.getEntriesByName('Execution Time')[0];
    console.log(`${measure.duration.toFixed(4)}ms`);
  }
}