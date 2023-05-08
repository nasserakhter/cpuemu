// registers and memory

import { chipset } from "../devices/chipset.js";
import { interrupts } from "../devices/interrupts.js";
import { ram } from "../devices/ram.js";
import { stack } from "../devices/stack.js";
import { FLAGS, REGISTERS_COUNT } from "./constants.js";
import { compileDrivers, hasCliFlag, loadBinary, loadDrivers, startupChecks } from "./utils.js";

export async function setup(aex) {
  globalThis.registers = [0, '', '', ...new Array(REGISTERS_COUNT + 1).fill(0)];
  // chipset drivers should have access to the entire bus
  globalThis.instructionFlags = FLAGS.PROTECTED_MEMORY;
  globalThis.shouldPrint = false;
  globalThis.debug = hasCliFlag('debug-drivers');
  globalThis.step = hasCliFlag('step-drivers');
  globalThis.printReturn = hasCliFlag('print-return-drivers');
  await startupChecks();
  
  // attach RAM into the first part of the bus
  if (hasCliFlag('interrupts')) interrupts();
  if (hasCliFlag('ram')) ram();
  if (hasCliFlag('chipset')) chipset();
  stack();
  
  console.log("Compiling and loading drivers...");
  const compiledDrivers = await compileDrivers();
  await loadDrivers(compiledDrivers);
  console.log("Finished loading drivers");


  globalThis.instructionFlags = 0;
  if (hasCliFlag('unprotect-memory')) {
    instructionFlags |= FLAGS.PROTECTED_MEMORY;
  }
  globalThis.debug = hasCliFlag('debug');
  globalThis.step = hasCliFlag('step');
  globalThis.shouldPrint = true;
  const [codeSegStart] = loadBinary(aex);
  registers[0] = codeSegStart;
}