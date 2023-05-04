'use strict';

import chalk from 'chalk';
import { assembleAndRun } from './src/assembleAndRun.js';
import { hasCliFlag } from './src/utils.js';

try {
  await assembleAndRun();
} catch(e) {
  if (hasCliFlag('error-traces')) console.log(e);
  console.log(chalk.red(e.message));
}