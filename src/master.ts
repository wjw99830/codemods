import { Transformer } from './utils';
import { fork } from 'child_process';
import globby from 'globby';
import { cpus } from 'os';
import { IWorkerContext, WorkerMessage, EWorkerAction } from './worker';
import { pushError, printError } from './error';
import { info } from './logger';
import { getOptions, IOptions } from '.';
import { printAnalyzes } from './analyze';

export function run(
  transformers: Transformer[],
  pattern: string,
  options: IOptions
) {
  info('start working');
  const files = getFiles(pattern);
  const workerNum = cpus().length;
  for (let i = 0; i < workerNum; i++) {
    const worker = fork('./worker', undefined, {
      stdio: ['ignore', 'inherit', 'ignore'],
    });
    worker.on('message', (e: WorkerMessage) => {
      if (e.action === EWorkerAction.Idle) {
        worker.send(createWorkerContext());
      } else if (e.action === EWorkerAction.Error) {
        pushError(e.error);
      }
    });
  }

  function createWorkerContext(): IWorkerContext {
    return {
      file: files.next(),
      options,
      transformers,
    };
  }
}

export function getFiles(pattern: string) {
  const files = globby.sync(pattern, { gitignore: true });
  let count = 0;
  function next() {
    if (count < files.length) {
      return files[count++];
    } else {
      return files[files.length - 1];
    }
  }
  function exhausted() {
    return count === files.length;
  }

  return {
    next,
    exhausted,
  };
}

process.on('beforeExit', e => {
  if (!getOptions().silent && e === 0) {
    printAnalyzes();
    printError();
  }
});
