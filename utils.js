import { FLAGS } from "./constants.js";

export function protectedMemCheck(a) {
  if (instructionFlags & FLAGS.PROTECTED_MEMORY) return;

  Object.values(busProtectedRanges).forEach(([start, end]) => {
    if (a >= start && a <= end) {
      throw new Error(
        "Cannot access protected memory " +
        hex(start) + " -> " + hex(end)
      );
    }
  });
}

export const hex = (num = 0) => `0x${num.toString(16).toUpperCase()}`;

export const write = (text) => process.stdout.write(text);

export const hasCliFlag = (flag) => !!process.argv.find(i => i === '--' + flag);

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