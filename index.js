import chalk from 'chalk';
import { assembleAndRun } from './src/assembleAndRun.js';

try {
  await assembleAndRun();
} catch(e) {
  console.log(e);
  console.log(chalk.red(e.message));
}