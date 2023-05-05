import { MAX_32_BIT } from "../src/constants.js";
import crypto from 'crypto';
import { write } from "../src/utils.js";
import chalk from "chalk";

global.ranges = {
  //'uuid': [0, 16], // virtual address 0 -> 16
}

globalThis.busProtectedRanges = {
  //'uuid': [0, 16], // virtual address 0 -> 16 is protected
};

global.busDevices = {
  //'uuid': [/* RAW BYTES 0x00,0x00,0x00... */],
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
    start = currRange[1] + 1;
  }
  if (MAX_32_BIT - start >= size) {
    return [
      start,
      start + size - 1// start === 0 ? start + size : start + size + 1
    ];
  }
  throw new Error('Address bounds exceeded, could not attach bus device');
}

const growBusDeviceRange = (id, amount, reverse = false) => {
  let [start, end] = ranges[id];
  if (reverse) start -= amount;
  else end += amount;

  if (start < 0 || end >= MAX_32_BIT) {
    throw new Error('Address Range Overflow, could not grow bus device');
  }

  // check if new range overlaps with any other range
  const overlaps = Object.entries(ranges).filter(x => x[0] !== id).some(([,[s, e]]) => {
    return (start >= s && start <= e) || (end >= s && end <= e);
  });

  if (overlaps) {
    throw new Error('Address Range Overlap, could not grow bus device');
  }

  ranges[id] = [start, end];
  if (busProtectedRanges[id]) {
    busProtectedRanges[id] = [start, end];
  }
  
  return [start, end];
}

const attachBusDevice = (array, start, end, options) => {
  const print = (options?.print ?? true) && shouldPrint === true;
  const name = options?.name ?? null;
  const isProtected = options?.protected ?? false;

  if (start > end) throw new Error('Invalid arguments, could not attach bus device');
  const id = crypto.randomUUID() + (name ? `#${name}` : '');
  //const arr = [...array];
  const arr = array;
  ranges[id] = [start, end];
  busDevices[id] = arr;
  if (isProtected) {
    busProtectedRanges[id] = [start, end];
  }

  if (print && debug) {
    console.log();
    console.log('Attached new bus device');
    Object.entries(ranges).sort(([,[startA]], [, [startB]]) => startA - startB).forEach(([id, [start, end]]) => {
      const nameI = id.indexOf('#');
      write(chalk.bgGreen.black(` ${start}`.padEnd(11)));
      write(chalk.bgGreen.black(' -> '));
      write(chalk.bgGreen.black(`${end}`.padEnd(11)));
      write(': ');
      const isEntryProtected = !!busProtectedRanges[id];
      const chalkFun = isEntryProtected ? chalk.bgRed.black : chalk.bgYellow.black;
      write(chalkFun.black(id.slice(0, 8)));
      if (nameI > -1) {
        write(chalk.bgGray.yellow(` ${id.slice(nameI + 1)} `));
      }
      console.log();
    });
    console.log();
  }
  return id;
}

globalThis.getOpenRange = getOpenRange;
globalThis.attachBusDevice = attachBusDevice;
globalThis.growBusDeviceRange = growBusDeviceRange;

const backBus = [];

const handler = {
  get: function (target, prop, receiver) {
    if (prop === 'length') return MAX_32_BIT;
    if (prop === 'slice') return (start, end) => {
      const arr = [];
      for (let i = start; i < end; i++) {
        arr.push(bus[i]);
      }
      return arr;
    };
    const index = Number(prop);

    if (isNaN(index)) return Reflect.get(target, prop);
    if (index < 0 || index >= MAX_32_BIT) {
      throw new Error('Segmentation fault (read, core not dumped)');
    }

    const llDevice = Object.entries(ranges)
      .find(([, [start, end]]) => index >= start && index <= end);

    if (llDevice) {
      return busDevices[llDevice[0]][index - llDevice[1][0]] ?? 0;
    } else {
      //console.log('Warning: read from unmapped memory region, the MMU will return 0 but this is likely a bug in your code.')
      return 0x00; // for unmapped memory, return 0x00
    }
  },
  set: function (target, prop, value) {
    const index = Number(prop);

    if (isNaN(index)) return Reflect.set(target, prop, value);
    
    if (index < 0 || index >= MAX_32_BIT) {
      throw new Error('Segmentation fault (write, core not dumped)');
    }


    const llDevice = Object.entries(ranges)
      .find(([, [start, end]]) => index >= start && index <= end);

    if (llDevice) {
      busDevices[llDevice[0]][index - llDevice[1][0]] = value;
      return true;
    } else {
      throw new Error('Access violation, unmapped memory region');
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

globalThis.bus = new Proxy(backBus, handler);