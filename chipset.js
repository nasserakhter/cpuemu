import { CHIPSET_INTERVAL, CHIPSET_OPERATIONS } from "./constants.js";
import { hasCliFlag } from "./utils.js";

export async function chipset(start, end) {
  const shouldPrint = hasCliFlag('chipset-logs');
  setInterval(() => {
    switch (bus[start]) {
      case CHIPSET_OPERATIONS.SHUTDOWN:
        console.log('Shutting down...');
        process.exit(0);
    }

    if (shouldPrint) {
      console.log(`[${start}] ${bus[start]}`);
    }
  }, CHIPSET_INTERVAL);
}