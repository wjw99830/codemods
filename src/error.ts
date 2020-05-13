import { red } from 'chalk';
const errors: string[] = [];

export function pushError(msg: string) {
  errors.push(red('X') + ' ' + msg);
}

export function printError() {
  for (const error of errors) {
    console.log(error);
  }
}
