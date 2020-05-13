import * as path from 'path';
import * as fs from 'fs-extra';
import { Transformer } from './utils';
import commander from 'commander';
import { info } from './logger';
import { run } from './master';
import { ZentVersion } from './version';
import { getConfig } from './config';
import { Falsey } from 'utility-types';

function getOptions(): IOptions {
  const options: IOptions = {
    target: 8,
    quote: 'auto',
    silent: false,
    output: false,
  };
  const config = getConfig();
  Object.assign(options, config?.options, {
    target: program.target,
    silent: program.silent,
    quote: program.quote,
    output: program.output,
  });
  return options;
}

interface IOptions {
  target: number;
  quote: 'single' | 'double' | 'auto';
  silent: boolean;
  output: boolean;
}

export { getOptions, IOptions };

const transformsDir = path.join(__dirname, 'transformers');
const transformerModules: {
  transformer: Transformer;
  name: string;
  description: string;
}[] = fs
  .readdirSync(transformsDir)
  .filter(it => it.match(/\.js$/))
  .map(it => {
    return {
      ...require(path.resolve(transformsDir, it)),
      name: it.replace('.js', ''),
    };
  });

const program = commander.version('0.0.1');

program.action(() => {
  const config = getConfig();
  if (!config) {
    info('no available config file, exit immediately.');
    process.exit(1);
    return;
  }
  const { pattern } = config;
  const options = getOptions();
  const transformers = transformerModules
    .filter(it => config.transformers?.includes(it.name))
    .map(it => it.transformer);

  if (!pattern) {
    info('no available pattern, exit immediately.');
    process.exit(1);
    return;
  }
  run(transformers, pattern, options);
});

for (const { name, description, transformer } of transformerModules) {
  program
    .command(name + ' <pattern>', description)
    .action((pattern: string) => {
      run([transformer], pattern, getOptions());
    });
}

program.command('all <glob_pattern>').action((pattern: string) => {
  run(
    transformerModules.map(it => it.transformer),
    pattern,
    getOptions()
  );
});

program
  .option('-s --silent', 'no stdout, default is false')
  .option(
    '-t --target <target>',
    'target verison of zent, default is ' + ZentVersion
  )
  .option('-o --output', 'write to output instead of overwriting files')
  .option('-q --quote', 'tells code generator which style of quote to use');

program.parse(process.argv);

declare global {
  /* eslint-disable-next-line @typescript-eslint/interface-name-prefix */
  interface Array<T> {
    /* eslint-disable-next-line no-undef */
    filter(cb: typeof Boolean): Exclude<T, Falsey>[];
  }
}
