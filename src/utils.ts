import {
  File,
  JSXOpeningElement,
  isJSXIdentifier,
  isJSXAttribute,
  JSXAttribute,
} from '@babel/types';
import traverse from '@babel/traverse';
import { Collection } from 'jscodeshift/src/Collection';
import { j } from './jscodeshift';
import core from 'jscodeshift';

export const { is, keys, values, entries } = Object;

export interface ITransformContext {
  target: number;
  file: string;
  zentImport: Collection<core.ImportDeclaration>;
  zentImportSpecifiers: Collection<core.ImportSpecifier>;
  getLocal(component: string): string | undefined;
}

export type Transformer = (
  ast: Collection<any>,
  ctx: ITransformContext
) => void;

export function findProp(name: string, jsxOpeningElement: JSXOpeningElement) {
  const { attributes } = jsxOpeningElement;
  return attributes.find(
    attr => isJSXAttribute(attr) && attr.name.name === name
  ) as JSXAttribute | undefined;
}

export function isPlainObject(val: any): val is Record<string, any> {
  return (
    val &&
    typeof val === 'object' &&
    Object.prototype.toString.call(val) === '[object Object]'
  );
}

// export function pipe(...fns: Transformer[]) {
//   return function (input: Collection<any>, ctx: ITransformContext) {
//     let result = input;
//     for (const fn of fns) {
//       if (temp) {
//         result = fn(result, ctx);
//       }
//     }
//     return result;
//   };
// }

export function findLocal(component: string, ast: File): string | null {
  let local: string | null = null;
  traverse(ast, {
    ImportDeclaration(path) {
      if (path.node.source.value === 'zent') {
        path.traverse({
          ImportSpecifier(path) {
            const { name } = path.node.imported;
            if (name === component) {
              local = path.node.local.name;
            }
          },
        });
      }
    },
  });
  return local;
}

export function findComponentLocals(ast: Collection<any>) {
  const mapComponentToLocal: Record<string, string> = {};
  const zentImport: Collection<core.ImportDeclaration> = ast.find(
    j.ImportDeclaration,
    (node: core.ImportDeclaration) => node.source.value === 'zent'
  );
  zentImport.forEach(it => {
    for (let i = 0; i < it.node.specifiers.length; i++) {
      const specifier = it.node.specifiers[i];
      const imported = specifier.name?.name;
      const local = specifier.local?.name;
      if (imported) {
        mapComponentToLocal[imported] = local || imported;
      }
    }
  });
  return mapComponentToLocal;
}

export function isComponent(
  component: string,
  it: core.ASTPath<core.JSXElement>
) {
  const name = it.node.name;
  switch (name.type) {
    case 'JSXIdentifier':
      return name.name === component;
    case 'JSXMemberExpression':
      return name.property.name === component;
    case 'JSXNamespacedName':
      return name.name.name === component;
    default:
      throw new TypeError(`Unexpected type of JSXElement['name']`);
  }
}

/**
 * 把一个值转为字符串
 */
export function toString(value: any) {
  if (value && typeof value === 'object') {
    return JSON.stringify(value);
  } else {
    return String(value);
  }
}

/**
 * 生成字面量的AST节点，包括数组和对象
 * @param value
 */
export function literal(
  value: any
):
  | core.Literal
  | core.Identifier
  | core.ObjectExpression
  | core.ArrayExpression {
  if (value === undefined) {
    return j.identifier('undefined');
  } else if (isPlainObject(value)) {
    return j.objectExpression(
      Object.keys(value).map(key =>
        j.objectProperty(j.stringLiteral(key), literal(value[key]))
      )
    );
  } else if (Array.isArray(value)) {
    return j.arrayExpression(value.map(it => literal(it)));
  } else {
    return j.literal(value);
  }
}
