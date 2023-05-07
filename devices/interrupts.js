import { INTERRUPT_TABLE_SIZE } from "../src/constants.js";

export async function interrupts() {
  const [start, end] = getOpenRange(INTERRUPT_TABLE_SIZE);
  attachBusDevice(
    new Uint32Array(INTERRUPT_TABLE_SIZE),
    start, end,
    {
      print: false,
      name: 'INTERRUPT TABLE',
      protected: true
    }
  );
}