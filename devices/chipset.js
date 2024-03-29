import { CHIPSET_OPERATIONS, CHIPSET_SIZE } from "../src/constants.js";
import { hasCliFlag } from "../src/utils.js";

//const g_shouldPrint = hasCliFlag('chipset-logs');
let g_buffer = null;

export async function chipset() {
  // import code segment into the bus
  g_buffer = new Uint32Array(CHIPSET_SIZE);
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
    name: 'SYSTEM',
    protected: true
  });
}

// based off of the set registers, determine what actions to take
async function determineActions(prop) {
  if (prop !== '0') return;
  switch (g_buffer[0]) {
    case CHIPSET_OPERATIONS.SHUTDOWN:
      console.log('\nShutting down...');
      process.exit(0);
  }
}