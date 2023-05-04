import { INTERRUPT_TABLE_SIZE } from "../constants.js";

export async function interrupts() {
  const [start, end] = getOpenRange(INTERRUPT_TABLE_SIZE);
  attachBusDevice(
    Buffer.alloc(INTERRUPT_TABLE_SIZE),
    start, end,
    {
      print: false,
      name: 'INTERRUPT TABLE',
      protected: true
    }
  );
}