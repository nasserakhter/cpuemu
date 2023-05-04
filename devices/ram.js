import { TOTAL_MEMORY_SIZE } from "../src/constants.js";

export async function ram() {
  const [start, end] = getOpenRange(TOTAL_MEMORY_SIZE);
  attachBusDevice(
    Buffer.alloc(TOTAL_MEMORY_SIZE),
    start, end,
    {
      print: false,
      name: 'RAM',
    }
  );
}