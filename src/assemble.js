import path from "path";
import { ARG_SIZE, INSTRUCTION_SIZE, MAGIC, MAGIC_SIZE, MAX_32_BIT, OPCODE_SIZE, REFS, REF_SIZE } from "./constants.js";
import { opcodesKeys } from "./opcodes.js";
import { hasCliFlag } from "./utils.js";
import fs from 'fs';

function stringToLines(str) {
  return str.replace(/\s*;[^\n]*$/gm, '') // comments
    .trim()
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);
}

function resolveIncludes(lines, options, parentFile = null) {
  const includes = [];

  // loop includes first because they will be joined as one file
  lines = lines.filter((_line) => {
    if (_line[0] === '%' && _line.startsWith('%include')) {
      let line = _line.slice(1);
      const directive = line.slice(0, line.indexOf(' ') >>> 0);
      line = line.slice(directive.length).trim();


      const fileName = (line.endsWith('.asm') ? line : `${line}.asm`).replace(/\\|\//g, path.sep);
      const fullPath = parentFile ? path.join(path.dirname(parentFile), fileName) : fileName;
      if (options.included.has(fullPath)) return false;

      const file = fs.readFileSync(fullPath, 'utf-8');
      const newLines = stringToLines(file);

      options.included.add(fullPath);
      includes.push(...resolveIncludes(newLines, options, fullPath));
      return false;
    }
    return true;
  });

  return [...lines, ...includes]; // array of every line of every included file combined
}

function preproccess(asm) {
  let lines = stringToLines(asm);

  // run preprocessor directives
  const constants = {};

  const resolveOptions = { included: new Set() };
  lines = resolveIncludes(lines, resolveOptions, null);

  // now we included all the files, we can preprocess the rest
  lines = lines.filter((_line) => {
    if (_line[0] === '%') {
      let line = _line.slice(1);
      const directive = line.slice(0, line.indexOf(' ') >>> 0);
      line = line.slice(directive.length).trim();

      switch (directive) {
        case 'define':
          const name = line.slice(0, line.indexOf(' ') >>> 0);
          const value = line.slice(name.length).trim();
          constants[name] = value;
          break;
        default:
          throw new Error(`Unknown preprocessor directive ${directive}`);
      }
      return false;
    }
    return true;
  });

  const evaluateConstant = (expr) => {
    // three scenario's
    // 1: it's a number
    // 2: it's a reference to another constant
    // 3: it's an addition of many constants
    if (isNaN(+expr)) {
      if (constants[expr]) {
        // it's a reference to another constant
        return evaluateConstant(constants[expr]);
      } else {
        // it's not a number
        // check if any addition is needed
        const parts = expr.split('+').map(x => x.trim());
        const evaluatedParts = parts.map(evaluateConstant);
        return evaluatedParts.reduce((a, b) => a + b, 0);
      }
    } else {
      // it's a number
      return +expr;
    }
  }

  Object.keys(constants).forEach((key) => {
    constants[key] = evaluateConstant(constants[key]);
  });

  // collect labels
  const labels = {};
  let labelsCount = 0;
  lines = lines.filter((line, i) => {
    if (line.match(/^[a-zA-Z\_]+\:$/gm)) {
      const labelName = line.slice(0, -1);
      if (labels[labelName]) throw new Error(`DUPLICATE_DECLARATION ${labelName}`);
      labels[labelName] = i - labelsCount + 1;
      labelsCount++;
      return false;
    }
    return true;
  });

  lines = lines.map((x, i) => {
    if (x.indexOf('[') && x.indexOf(']')) {
      // we have some kind of reference or whatnot
      const matches = x.match(/\[[a-zA-Z\_]{1}[a-zA-Z0-9\_]*\]/g); // get all references
      if (matches) {
        for (i = 0; i < matches.length; i++) {
          const match = matches[i].slice(1, -1);
          if (constants[match]) {
            x = x.replace(`[${match}]`, constants[match]);
          }
        }
      }
    }

    if (x.indexOf('"')) {
      // we have some kind of string
      const matches = x.match(/\"[^\"]*\"/g); // get all strings
      if (matches) {
        for (i = 0; i < matches.length; i++) {
          const match = matches[i].slice(1, 2);
          const char = match.charCodeAt(0);
          x = x.replace(`"${match}"`, char);
        }
      }
    }

    if (x.match(/\s[a-zA-Z\_]+$/g)) {
      const [jmp, label] = x.split(' ');
      if (labels[label]) {
        const num = labels[label] - i - 1;
        return `${jmp} ${num > 0 ? '+' : ''}${num}`;
      } else {
        throw new Error(`NULL_REFERENCE ${label}`);
      }
    } else {
      return x;
    }
  })

  return lines;
}

export function assemble(asm, print = true) {
  if (asm.length === 0) throw new Error('INTANGIBLE_TARGET');

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