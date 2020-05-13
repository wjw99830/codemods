import { green } from 'chalk';
import { SourceLocation } from 'jscodeshift';

const analyzes: Record<string, Record<string, string[]>> = {};

export function analyze(
  component: string,
  message: string,
  file: string,
  loc?: { line: number; column: number }
) {
  let messages = analyzes[component];
  if (!messages) {
    messages = {};
    analyzes[component] = messages;
  }
  let files = messages[message];
  if (!files) {
    files = [];
    messages[message] = files;
  }
  let fileLink = file;
  if (loc) {
    fileLink += `:${loc.line}:${loc.column + 1}`;
  }
  files.push(fileLink);
}

export function printAnalyzes() {
  if (!Object.keys(analyzes).length) {
    console.log('');
    console.log('啥也没改，有两种可能：');
    console.log('1. 不兼容的地方比较少;');
    console.log('2. 不兼容的地方改起来比较复杂，照着 changelog 改吧，加油 🚀');
  } else {
    console.log('');
    console.log('⬇️  Zent Codemod Analyzes');
    console.log('');
    for (const [component, messages] of Object.entries(analyzes)) {
      console.log('- ' + component);
      for (const [message, files] of Object.entries(messages)) {
        console.log('    - ' + message);
        for (const file of files) {
          console.log('        - ' + file);
        }
      }
    }
  }
  console.log('');
  console.log(
    `${green('Change Log')}: http://fedoc.qima-inc.com/zent/zh/guides/changelog`
  );
  console.log('');
}
