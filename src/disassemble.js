import fs from 'fs';
import { ARG_SIZE, MAGIC, OPCODE_SIZE, REFS, REF_SIZE } from './constants.js';
import { opcodes } from './opcodes.js';

const path = process.argv[2];

const file = fs.readFileSync(path);

let offset = 0;

if (file.slice(0, 3).toString('utf8') !== MAGIC) {
  console.log('Invalid executable');
  process.exit(1);
} else {
  offset += 3;
}

let lines = [];

while (offset < file.length) {
  const opcode = file.readUInt8(offset);
  offset += OPCODE_SIZE;
  
  const aRef = file.readUInt8(offset);
  offset += REF_SIZE;
  let a = file.readUInt32LE(offset);
  offset += ARG_SIZE;

  const bRef = file.readUInt8(offset);
  offset += REF_SIZE;
  let b = file.readUInt32LE(offset);
  offset += ARG_SIZE;

  if (aRef === REFS.REGISTER) a = `R${a}`;
  if (aRef === REFS.ADDRESS) a = `[${a}]`;
  if (aRef === REFS.ADDRESS_AT_REGISTER) a = `[R${a}]`;
  if (aRef === REFS.RELATIVE) a = `+${a}`;
  if (aRef === REFS.RELATIVE_NEGATIVE) a = `-${a}`;

  if (bRef === REFS.REGISTER) b = `R${b}`;
  if (bRef === REFS.ADDRESS) b = `[${b}]`;
  if (bRef === REFS.ADDRESS_AT_REGISTER) b = `[R${b}]`;
  if (bRef === REFS.RELATIVE) b = `+${b}`;
  if (bRef === REFS.RELATIVE_NEGATIVE) b = `-${b}`;

  lines.push(
    opcodes[opcode].name
    + ` ${a}`
    + `, ${b}`
  );
}

console.log(lines.join('\n'));