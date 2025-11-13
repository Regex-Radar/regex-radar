# Regex Radar - Fixture

This is the fixture to test and showcase the features of Regex Radar.

## Structure

### `.vscode/settings.json`

Workspace settings file to toggle tracing between the language client & language server.

### `directory/`

To test the nested discovery pattern:

- `empty` to test for empty directories.
- `non-empty-no-regex` to test for directories with source code, but no regexes.
- `non-empty-with-regex` to test for directories with source code and regexes.

### `node_modules/`

A sample `node_modules/` folder to test the discovery ignore behaviour.

### `linter.ts`

A sample file to test the linter.

### `redos.ts`

A sample file to test ReDoS detection.

### `languages/`

A directory to test different language (files).

- `sample.js` (`javascript`)
- `sample.jsx` (`javascriptreact`)
- `sample.ts` (`typescript`)
- `sample.tsx` (`typescriptreact`)

For more tree-sitter grammars see: https://github.com/orgs/tree-sitter-grammars/repositories?

NOTE: embedded languages like html, vue to use some kind of `injection.language` pattern. see other implementations for exampeles.

### `to_implement.ts`

Patterns and features not implemented yet.
