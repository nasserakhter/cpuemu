import { FLAGS, INTERRUPT_TABLE_OFFSET, INTERRUPT_TABLE_SIZE } from "./constants.js";

export function protectedMemCheck(a) {
  const start = INTERRUPT_TABLE_OFFSET;
  const end = INTERRUPT_TABLE_OFFSET + INTERRUPT_TABLE_SIZE;
  if (
    a >= start &&
    a <= end &&
    !(instructionFlags & FLAGS.PROTECTED_MEMORY)
  ) {
    throw new Error(
      "Cannot access protected memory " +
      hex(start) + " -> " + hex(end)
    );
  }
}

export const hex = (num = 0) => `0x${num.toString(16).toUpperCase()}`;

export const write = (text) => process.stdout.write(text);

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