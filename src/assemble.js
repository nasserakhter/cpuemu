import { ARG_SIZE, INSTRUCTION_SIZE, MAGIC, MAGIC_SIZE, MAX_32_BIT, OPCODE_SIZE, REFS, REF_SIZE } from "./constants.js";
import { opcodesKeys } from "./opcodes.js";
import { hasCliFlag } from "./utils.js";

function preproccess(asm) {
  let lines = asm
    .replace(/\s*;[^\n]*$/gm, '') // comments
    .trim()
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  // find all labels
  const labels = {};
  let labelsCount = 0;

  lines = lines.filter((line, i) => {
    if (line.match(/^[a-zA-Z\_]+\:$/gm)) {
      labels[line.slice(0, -1)] = i - labelsCount + 1;
      labelsCount++;
      return false;
    }
    return true;
  });

  lines = lines.map((x, i) => {
    if (x.match(/\s[a-zA-Z\_]+$/g)) {
      const [jmp, label] = x.split(' ');
      if (labels[label]) {
        const num = labels[label] - i - 1;
        return `${jmp} ${num > 0 ? '+' : ''}${num}`;
      } else {
        throw new Error(`Invalid label: ${label}`);
      }
    } else {
      return x;
    }
  })

  return lines;
}

export function assemble(asm, print = true) {
  if (asm.length === 0) {
    console.log('Invalid assembly');
    process.exit(1);
  }
  
  asm = preproccess(asm);

  const debug = hasCliFlag('debug');

  if (debug && print) {
    console.log('\nFinal Assembly:');
    asm.forEach((x, i) => console.log(`${i + 1}| ${x}`));
    console.log();
  }

  const exeSize = INSTRUCTION_SIZE * asm.length;

  const aex = Buffer.alloc(MAGIC_SIZE + exeSize);

  aex.write(MAGIC, 0);
  let offset = MAGIC_SIZE;

  asm.forEach(i => {
    const asmOpcode = i.slice(0, i.indexOf(' ') >>> 0);
    const operands = i.slice(asmOpcode.length + 1);
    if (operands?.indexOf(',') !== operands?.indexOf(', ')) {
      throw new Error(`Invalid syntax, space after comma is required: ${i}`);
    }
    const [_a, _b] = operands?.split(', ') ?? [null, null];
    let a = _a?.trim() ?? '';
    let b = _b?.trim() ?? '';

    //if (asmOpcode === 'NOP') return;
    const opcode = opcodesKeys[asmOpcode];
    if (isNaN(opcode)) throw new Error(`Invalid opcode: ${asmOpcode}`);
    aex.writeUint8(opcode, offset);
    offset += OPCODE_SIZE;

    // operands matching

    if (a[0] === 'R') {
      aex.writeUint8(REFS.REGISTER, offset);
      a = a.slice(1);
    } else if (a[0] === '[' && a[1] === 'R' && a[a.length - 1] === ']') {
      aex.writeUint8(REFS.ADDRESS_AT_REGISTER, offset);
      a = a.slice(2, -1);
    } else if (a[0] === '[' && a[a.length - 1] === ']') {
      aex.writeUint8(REFS.ADDRESS, offset);
      a = a.slice(1, -1);
    } else if (a[0] === '+') {
      aex.writeUint8(REFS.RELATIVE, offset);
      a = a.slice(1);
    } else if (a[0] === '-') {
      aex.writeUint8(REFS.RELATIVE_NEGATIVE, offset);
      a = a.slice(1);
    } else {
      aex.writeUint8(REFS.IMMEDIATE, offset);
    }

    a = parseInt(a);

    offset += REF_SIZE;
    aex.writeUint32LE(a % MAX_32_BIT, offset);
    offset += ARG_SIZE;

    if (b[0] === 'R') {
      aex.writeUint8(REFS.REGISTER, offset);
      b = b.slice(1);
    } else if (b[0] === '[' && b[1] === 'R' && b[b.length - 1] === ']') {
      aex.writeUint8(REFS.ADDRESS_AT_REGISTER, offset);
      b = b.slice(2, -1);
    } else if (b[0] === '[' && b[b.length - 1] === ']') {
      aex.writeUint8(REFS.ADDRESS, offset);
      b = b.slice(1, -1);
    } else if (b[0] === '-') {
      aex.writeUint8(REFS.RELATIVE, offset);
      b = b.slice(1);
    } else if (b[0] === '-') {
      aex.writeUint8(REFS.RELATIVE_NEGATIVE, offset);
      b = b.slice(1);
    } else {
      aex.writeUint8(REFS.IMMEDIATE, offset);
    }

    b = parseInt(b);

    offset += REF_SIZE;
    aex.writeUint32LE(b % MAX_32_BIT, offset);
    offset += ARG_SIZE;

  });
  return aex;
}