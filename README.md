# codemods for zent

**⚠️ Codemods are not guaranteed to be safe for all inputs, you must review the output.**

To use these codemods, please install https://github.com/facebook/jscodeshift first.

## Transformers

- `explicit-optional-props`: Explicitly pass optional props whose default value has breaking change.

- `legacy-to-compat`: Move legacy components to `@zent/compat`.

- `refactor-loading`: Transform `Loading` elements as much as possible. Only for `--target 7`

- `remove-deprecated-props`: Remove deprecated props.

- `rename-props`: Rename props whose name has been change.

- `rename-string`: Rename literal string of some props which has been renamed.

- `switch-boolean-props`: Switch props which is boolean type as much as possible, and rename them ( if necessary ).

## Test

run `yarn test` to see the testing transform.

## Usage

```sh
zent-codemod [transformer] [options]
```

```sh
# use configuration file
zent-codemod
```

```sh
# use specified transformer and pattern
zent-codemod \
legacy-to-compat \
"./src/**/*.+(js,jsx,tsx)" \
-t 7
```

```sh
# use all transformers
zent-codemod all "./src/**/*.+(js,jsx,tsx)"
```

## Options

- target: the target major release of zent, default is latest major release
- silent: no stdout, default is `false`
- output: write to stdout instead of overwriting files
- color: highlight output when `output` enabled
- quote: style of quote. `'auto' | 'single' | 'double'` is valid, default is `auto`

## zent-codemod.json

```json
{
  "pattern": "**/*",
  "transformers": ["legacy-to-compat"],
  "options": {
    "target": 8,
    "silent": false,
    "output": false,
    "color": true,
    "quote": "auto"
  }
}
```
