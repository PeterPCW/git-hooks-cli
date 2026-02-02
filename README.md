# git-hooks-cli

<div align="center">

**Modern, type-safe git hooks manager for Node.js**

[![npm version](https://img.shields.io/npm/v/git-hooks-cli.svg)](https://www.npmjs.com/package/git-hooks-cli)
[![npm downloads](https://img.shields.io/npm/dw/git-hooks-cli)](https://www.npmjs.com/package/git-hooks-cli)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

## Features

- 🚀 **Zero dependencies** - Lightweight and fast
- 📦 **TypeScript native** - Full type safety out of the box
- 🎯 **Simple API** - Register and run hooks with minimal boilerplate
- 🔧 **Cross-platform** - Works on Windows, macOS, and Linux
- ⚡ **Modern Node.js** - Built for Node.js 18+

## Installation

```bash
npm install --save-dev git-hooks-cli

# or
yarn add -D git-hooks-cli

# or
pnpm add -D git-hooks-cli
```

## Quick Start

```typescript
import { createHookRunner, GIT_HOOKS } from 'git-hooks-cli'

// Create a hook runner
const runner = createHookRunner()

// Register a pre-commit hook
runner.register({
  name: 'pre-commit',
  command: 'npm run lint',
})

// Run the hook
await runner.run('pre-commit', ['file1.ts', 'file2.ts'])
```

## API Reference

### `createHookRunner()`

Creates a new HookRunner instance.

```typescript
import { createHookRunner } from 'git-hooks-cli'

const runner = createHookRunner()
```

### `runner.register(config)`

Register a new hook.

```typescript
runner.register({
  name: 'pre-commit',
  command: 'npm run lint',
  args: ['--fix'],
  condition: (files) => files.some(f => f.endsWith('.ts')),
})
```

### `runner.run(name, args)`

Execute a registered hook.

```typescript
const success = await runner.run('pre-commit', ['src/index.ts'])
```

### `runner.list()`

List all registered hooks.

```typescript
const hooks = runner.list()
console.log(hooks)
```

### `runner.unregister(name)`

Remove a registered hook.

```typescript
runner.unregister('pre-commit')
```

### `runner.clear()`

Clear all registered hooks.

```typescript
runner.clear()
```

## CLI Usage

This package provides a CLI tool for managing git hooks:

```bash
# Install the CLI globally
npm install -g git-hooks-cli

# Use npx to run directly
npx git-hooks

# Or use the local installation after npm install
./node_modules/.bin/git-hooks install
```

### CLI Commands

| Command | Description |
|---------|-------------|
| `git-hooks install [hook-name]` | Install git hooks from config |
| `git-hooks uninstall [hook-name]` | Remove installed hooks |
| `git-hooks list` | List configured hooks |
| `git-hooks status` | Show installed vs configured hooks |
| `git-hooks run <hook-name>` | Run a hook manually |

### Configuration

Configure hooks in `package.json`:

```json
{
  "name": "my-project",
  "git-hooks": {
    "pre-commit": "npm run lint",
    "pre-push": "npm run test"
  }
}
```

Or in `.git-hooksrc`:

```json
{
  "pre-commit": "npm run lint",
  "pre-push": "npm run test"
}
```

## Git Hooks Reference

All standard git hooks are supported:

| Hook | Description |
|------|-------------|
| `pre-commit` | Before a commit is created |
| `prepare-commit-msg` | After prepare-message but before editor |
| `commit-msg` | After commit message is set |
| `post-commit` | After a commit is created |
| `pre-push` | Before pushing to remote |
| `post-merge` | After a merge completes |
| `pre-rebase` | Before a rebase starts |
| And more... |

See the [Git hooks documentation](https://git-scm.com/docs/githooks) for the full list.

## Examples

### Running Multiple Commands

```typescript
runner.register({
  name: 'pre-commit',
  command: 'npm run lint && npm run typecheck',
})
```

### Conditional Hooks

```typescript
runner.register({
  name: 'pre-commit',
  command: 'npm run test',
  condition: (files) => files.some(f => f.includes('test')),
})
```

### Using with lint-staged

```typescript
runner.register({
  name: 'pre-commit',
  command: 'npx lint-staged',
})
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Inspired by the original [git-hooks](https://github.com/typicode/git-hooks) package
- Built for the modern Node.js ecosystem
