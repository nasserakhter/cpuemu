import { GPU_OPERATIONS, GPU_SIZE } from "../src/constants.js";
import { hasCliFlag } from "../src/utils.js";

//const g_shouldPrint = hasCliFlag('chipset-logs');
let g_buffer = null;

export async function gpu() {
  // import code segment into the bus
  g_buffer = new Uint32Array(GPU_SIZE);
  const [start, end] = getOpenRange(g_buffer.length);

  const buffer = new Proxy(g_buffer, {
    set: (target, prop, value) => {
      const result = Reflect.set(target, prop, value);
      determineActions(prop);
      return result;
    },
    get: (target, prop) => {
      return Reflect.get(target, prop);
    }
  });


  attachBusDevice(buffer, start, end, {
    print: false,
    name: 'GPU',
    protected: true
  });
}

// based off of the set registers, determine what actions to take
async function determineActions(prop) {
  if (prop !== '0') return;
  switch (g_buffer[0]) {
    case GPU_OPERATIONS.PRINT_CHAR:
      process.stdout.write(String.fromCharCode(g_buffer[1]));
      break;
    case GPU_OPERATIONS.PRINT_STRING:
      let addr = g_buffer[1];
      let shouldPrint = true;
      while (shouldPrint) {
        const char = bus[addr];
        if (char !== 0) {
          process.stdout.write(String.fromCharCode(char));
          addr++;
        } else {
          shouldPrint = false;
        }
      }
      break;
  }
}