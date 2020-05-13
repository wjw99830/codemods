import { Transformer, renameJSXElement } from '../utils';
import core from 'jscodeshift';
import { j } from '../jscodeshift';
import { analyze } from '../analyze';
import chalk from 'chalk';

const Loading = 'Loading';
const FullScreenLoading = 'FullScreenLoading';
const BlockLoading = 'BlockLoading';

export const transformer: Transformer = (
  ast,
  { file, target, getLocal, zentImport }
) => {
  if (target !== 7) {
    return;
  }

  const local = getLocal(Loading);
  if (!local) {
    return;
  }

  const elms = ast.findJSXElements(local);
  zentImport
    .find(
      j.ImportSpecifier,
      (it: core.ImportSpecifier) => it.imported.name === Loading
    )
    .remove();

  elms.forEach(it => {
    const { node } = it;
    const float = node.openingElement.attributes.find(
      it => it.type === 'JSXAttribute'
    ) as core.JSXAttribute | undefined;
    if (float) {
      if (!float.value) {
        analyze(
          chalk.red(Loading),
          `替换为 ${chalk.green(FullScreenLoading)}`,
          file,
          node.loc?.start
        );
        renameJSXElement(node, FullScreenLoading);
        zentImport
          .find(j.ImportSpecifier)
          .insertBefore(j.importSpecifier(j.identifier(FullScreenLoading)));
      } else {
        analyze(
          chalk.red(Loading),
          `无法替换为 ${chalk.green(BlockLoading)} 或 ${chalk.green(
            FullScreenLoading
          )}`,
          file,
          node.loc?.start
        );
      }
    } else {
      analyze(
        chalk.red(Loading),
        `替换为 ${chalk.green(BlockLoading)}`,
        file,
        node.loc?.start
      );
      renameJSXElement(node, BlockLoading);
      zentImport
        .find(j.ImportSpecifier)
        .insertBefore(j.importSpecifier(j.identifier(BlockLoading)));
    }
  });
};
