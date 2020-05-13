import { Transformer, entries, toString, literal } from '../utils';
import { analyze } from '../analyze';
import { red, yellow } from 'chalk';
import { j } from '../jscodeshift';
import core from 'jscodeshift';

const data: Record<number, Record<string, { name: string; value: any }[]>> = {
  7: {
    Tabs: [{ name: 'type', value: 'card' }],
  },
  8: {
    InfiniteScroller: [
      { name: 'hasMore', value: true },
      { name: 'useWindow', value: true },
    ],
    Affix: [{ name: 'offsetTop', value: 0 }],
  },
};

export const transformer: Transformer = (ast, { file, target, getLocal }) => {
  const changelog = data[target];
  if (!changelog) {
    return;
  }
  const components = Object.keys(changelog);

  const locals = components.map(it => getLocal(it)).filter(Boolean);
  if (!locals.length) {
    return;
  }

  const zentElms = ast.findJSXElementsByModuleName('zent');
  for (const [component, props] of entries(changelog)) {
    // 找出该组件
    const elms = zentElms.find(
      j.JSXOpeningElement,
      (it: core.JSXOpeningElement) =>
        it.name.type === 'JSXIdentifier' && it.name.name === getLocal(component)
    );
    elms.forEach(elm => {
      for (const prop of props) {
        // 找找有没有用到这个属性
        const { attributes } = elm.node;
        const attr = attributes.find(
          it =>
            it.type === 'JSXAttribute' &&
            it.name.type === 'JSXIdentifier' &&
            prop.name === it.name.name
        );
        // 没有用到的话，显示指定旧的默认值，保证行为不变
        if (!attr) {
          analyze(
            component,
            `${yellow(prop.name)} 的默认值改变，已显式指定为旧的默认值 ${red(
              toString(prop.value)
            )}`,
            file,
            elm.node.loc?.end
          );
          attributes.unshift(
            j.jsxAttribute(
              j.jsxIdentifier(prop.name),
              typeof prop.value === 'string'
                ? (literal(prop.value) as core.Literal)
                : prop.value === true
                ? undefined
                : j.jsxExpressionContainer(literal(prop.value))
            )
          );
        }
      }
    });
  }
};
