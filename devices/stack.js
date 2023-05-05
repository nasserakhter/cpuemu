import { MAX_32_BIT } from "../src/constants.js";
import assert from "assert";

let g_buffer = null;
let g_deviceId = null;

export async function stack() {
  g_buffer = [];
  const end = MAX_32_BIT - 1;
  const start = end - 1;

  const g_bufferReverse = new Proxy(g_buffer, {
    get: (target, prop) => {
      return Reflect.get(target, g_buffer.length - prop - 1);
    },
    set: (target, prop, value) => {
      return Reflect.set(target, g_buffer.length - prop - 1, value);
    }
  });

  g_deviceId = attachBusDevice(g_bufferReverse, start, end, {
    print: false,
    name: 'STACK',
  });
}

export function push(value) {
  try {
    growBusDeviceRange(g_deviceId, 1, true);
  } catch (_) {
    throw new Error('Stack overflow');
  }
  g_buffer.push(value);
}

export function pop() {
  try {
    assert(g_buffer.length > 0);
    growBusDeviceRange(g_deviceId, -1, true);
  } catch (_) {
    throw new Error('Stack underflow');
  }
  return g_buffer.pop();
}