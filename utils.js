import fs from 'fs';
import { FLAGS } from "./constants.js";

let configJson = {};

if (fs.existsSync('./config.json')) {
  configJson = JSON.parse(fs.readFileSync('./config.json'));
}

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

export const hasCliFlag = (flag) =>
  !!process.argv.find(i => i === '--' + flag) ||
  configJson[flag] === true;

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

export async function compileDrivers() {
  const driverAssemblies = fs.readdirSync('./drivers')
    .filter(x => x.endsWith(".asm"));

  const promises = driverAssemblies.map(async (driverAssembly) => {
    const driver = fs.readFileSync('./drivers/' + driverAssembly, 'utf8');
    const driverName = driverAssembly.replace('.asm', '');
    const driverBin = await assemble(driver);
    const driverBinPath = './drivers/' + driverName + '.aex';
    fs.writeFileSync(driverBinPath, driverBin);
    return driverBinPath;
  });

  return await Promise.all(promises);
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