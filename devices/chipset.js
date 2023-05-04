import { CHIPSET_OPERATIONS, CHIPSET_SIZE } from "../constants.js";
import { hasCliFlag } from "../utils.js";

const g_shouldPrint = hasCliFlag('chipset-logs');
let g_buffer = Buffer.alloc(0);

export async function chipset() {
  // import code segment into the bus
  const g_buffer = Buffer.alloc(CHIPSET_SIZE);
  const [start, end] = getOpenRange(g_buffer.length);

  attachBusDevice(g_buffer, start, end, {
    print: false,
    name: 'SYSTEM',
    protected: true
  });
}

// based off of the set registers, determine what actions to take
async function determineActions() {
  switch (g_buffer[0]) {
    case CHIPSET_OPERATIONS.SHUTDOWN:
      console.log('Shutting down...');
      process.exit(0);
  }
}