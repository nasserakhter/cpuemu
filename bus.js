import { MAX_32_BIT } from "./constants.js";
import crypto from 'crypto';

const ranges = {
  //'uuid': [0, 16], // virtual address 0 -> 16
}

const busDevices = {
  //'uuid': [],
}

const getOpenRange = (size) => {
  const sortedRanges = Object.values(ranges).sort((a, b) => a[0] - b[0]); // sort ranges by start position
  let start = 0;
  for (let i = 0; i < sortedRanges.length; i++) {
    const currRange = sortedRanges[i];
    const end = currRange[0];
    const gap = end - start;
    if (gap >= size) {
      return [start, start + size];
    }
    start = currRange[1];
  }
  if (MAX_32_BIT - start >= size) {
    return [start, start + size];
  }
  throw new Error('Address bounds exceeded, could not attach bus device');

}

const attachBusDevice = (array, start, end) => {
  if (start >= end) throw new Error('Invalid arguments, could not attach bus device');
  const id = crypto.randomUUID();
  const arr = [...array];
  ranges[id] = [start, end];
  busDevices[id] = arr;
  return id;
}

globalThis.getOpenRange = getOpenRange;
globalThis.attachBusDevice = attachBusDevice;

const handler = {
  get: function (target, prop, receiver) {
    if (isNaN(index) || index < 0 || index >= MAX_32_BIT) {
      throw new Error('Segmentation fault (core not dumped)');
    }

    const [llDevice, [llDeviceStart, llDeviceEnd]] = Object.entries(ranges).find(([,[start, end]]) => index >= start && index < end);

    if (llDevice) {
      return busDevices[llDevice][index - llDeviceStart];
    } else {
      return 0x00; // for unmapped memory, return 0x00
    }
  },
  set: function (target, prop, value, receiver) {
    const index = Number(prop);
    if (isNaN(index) || index < 0 || index >= MAX_32_BIT) {
      throw new Error('Segmentation fault (core dumped)');
    }

    const [llDevice, [llDeviceStart, llDeviceEnd]] = Object.entries(ranges).find(([,[start, end]]) => index >= start && index < end);

    if (llDevice) {
      busDevices[llDevice][index - llDeviceStart] = value;
    } else {
      throw new Error('Segmentation fault (core dumped)');
    }
  },
  getOwnPropertyDescriptor: function (target, prop) {
    const index = Number(prop);
    if (isNaN(index) || index < 0 || index >= target.length) {
      return undefined;
    }
    return { configurable: true, enumerable: true, value: target[index] };
  },
  ownKeys: function (target) {
    return Object.keys(target).concat(Object.keys(Array.prototype));
  }
};

globalThis.bus = new Proxy([], handler);
bus.length = MAX_32_BIT;