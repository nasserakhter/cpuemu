import fs from 'fs';
import {
  GLOBAL_ARGS_SIZE,
  INTERRUPT_TABLE_OFFSET,
  INTERRUPT_TABLE_SIZE,
  MEMORY_MAP_SIZE,
  TOTAL_MEMORY_SIZE
} from '../src/constants.js';

// RAM starts at address 0x08
// first 4 bytes are reserved for global func params
// MAP starts at address 0x0C
// MAP has a size of 4 so it can store a maximum of 4 addresses
// Real memory starts at address 0x10
// The map address contains the last address of the memory block// 

export function generate() {
  const src = `
    ; ======== AUTOMATICALLY GENERATED FILE ========
    ; GENERATED AT: ${new Date().toISOString()}
    ; EDITING THIS FILE IS NOT RECOMMENDED AS THE 
    ; CHANGES WILL NOT PERSIST. PLEASE EDIT THE
    ; GLOBAL.JS FILE INSTEAD.
    ; PATH: ./drivers/global.js
    ; ==============================================
    %define RAM_START         ${INTERRUPT_TABLE_SIZE + INTERRUPT_TABLE_OFFSET}
    %define RAM_SIZE          ${TOTAL_MEMORY_SIZE}
    %define GLOBAL_ARGS_SIZE  ${GLOBAL_ARGS_SIZE}
    %define MAP_SIZE          ${MEMORY_MAP_SIZE}

    %define ARG_1             RAM_START
    %define ARG_2             RAM_START + 1
    %define ARG_3             RAM_START + 2
    %define ARG_4             RAM_START + 3

    %define RAM_END           RAM_START + RAM_SIZE
    %define MAP_START         RAM_START + GLOBAL_ARGS_SIZE

    %define REAL_MEMORY_START MAP_START + MAP_SIZE
    %define REAL_MEMORY_END   RAM_END
    `;

  // store to file BEFORE we compile and load the drivers
  fs.writeFileSync('./drivers/global.asm', src);
}