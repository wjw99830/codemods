import * as fs from 'fs-extra';
import { Transformer } from './utils';
import { j } from './jscodeshift';
import { Collection } from 'jscodeshift/src/Collection';
import core from 'jscodeshift';
import { IOptions } from '.';

export interface IWorkerContext {
  file: string;
  options: IOptions;
  transformers: Transformer[];
}

export enum EWorkerAction {
  Idle,
  Error,
}

export type WorkerMessage =
  | {
      action: EWorkerAction.Error;
      error: any;
    }
  | {
      action: EWorkerAction.Idle;
    };

export async function perform({
  file,
  options: { target, quote, output },
  transformers,
}: IWorkerContext) {
  try {
    const source = (await fs.readFile(file)).toString();
    const ast = j(source);

    for (const transformer of transformers) {
      transformer(ast, { target, file, ...createZentHelper(ast) });
    }

    const out = ast.toSource({ quote });
    if (output) {
      console.log(file);
      console.log(out);
      console.log('');
    } else {
      await fs.writeFile(file, out);
    }
    process.send?.({ action: EWorkerAction.Idle });
  } catch (error) {
    process.send?.({ action: EWorkerAction.Error, error });
  }
}

process.on('message', perform);

process.send?.({ action: EWorkerAction.Idle });

function createZentHelper(ast: Collection<any>) {
  const mapComponentToLocals: Record<string, string> = {};
  const zentImport = ast.find(
    j.ImportDeclaration,
    (node: core.ImportDeclaration) => node.source.value === 'zent'
  );
  const zentImportSpecifiers = zentImport.find(j.ImportSpecifier);
  zentImportSpecifiers.forEach(it => {
    mapComponentToLocals[it.node.imported.name] =
      it.node.local?.name || it.node.imported.name;
  });
  /**
   * 根据组件名找出组件在当前模块的别名
   * @param component 组件名
   * @returns 组件的别名
   */
  function getLocal(component: string): string | undefined {
    return mapComponentToLocals[component];
  }
  return { getLocal, zentImport, zentImportSpecifiers };
}
