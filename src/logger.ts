import { getOptions } from '.';
import chalk from 'chalk';

export function info(msg: string) {
  getOptions().silent || console.log(chalk.yellow('info: ') + msg);
}
