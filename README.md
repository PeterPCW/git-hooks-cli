# git-hooks-cli

<div align="center">

**Modern, type-safe git hooks manager for Node.js**

[![NPM Package](https://img.shields.io/npm/v/git-hooks-cli.svg)](https://www.npmjs.com/package/git-hooks-cli)
[![NPM Downloads](https://img.shields.io/npm/dw/git-hooks-cli)](https://www.npmjs.com/package/git-hooks-cli)
[![License](https://img.shields.io/npm/l/git-hooks-cli.svg)](LICENSE)

</div>

## Features

- 🚀 **Zero dependencies** - Lightweight and fast
- 📦 **TypeScript native** - Full type safety out of the box
- 🎯 **Simple API** - Register and run hooks with minimal boilerplate
- 🔧 **Cross-platform** - Works on Windows, macOS, and Linux
- ⚡ **Modern Node.js** - Built for Node.js 18+
- 🔀 **Parallel execution** - Run multiple commands concurrently
- 🎨 **Styled output** - Optional pretty tables with `--styled` flag
- ✋ **Ignore patterns** - Skip files matching patterns
- ✅ **Configuration validation** - Built-in config checker

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

## Styled Output

For beautiful table output, use the `--styled` flag:

```bash
# Simple output (zero dependencies)
git-hooks list

# Styled output (requires cli-table-modern)
git-hooks list --styled
```

**Simple output:**
```
  ✓  pre-commit
  ✗  pre-push
```

**Styled output** (with `--styled`):
```
┌──────────┬───────────┬─────────────┐
│ Enabled  │ Hook      │ Command     │
├──────────┼───────────┼─────────────┤
│ ✓        │ pre-commit │ npm run lint │
│ ✗        │ pre-push   │ npm run test│
└──────────┴───────────┴─────────────┘
```

The `--styled` flag uses [cli-table-modern](https://github.com/PeterPCW/cli-table-modern) for pretty output. It is **lazily loaded** — cli-table-modern is only downloaded when you use `--styled`, keeping your bundle zero-dependency by default.

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
  parallel: false,
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

### Runner Options

```typescript
// Enable parallel execution
runner.parallelExec(true)

// Set ignore patterns
runner.ignore(['dist/', 'node_modules/'])

/ Enable colored output
runner.useColors(true)
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
| `git-hooks list --styled` | List hooks with pretty table output |
| `git-hooks status` | Show installed vs configured hooks |
| `git-hooks check` | Validate configuration |
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

Or in `.git-hookrc`:

```json
{
  "pre-commit": "npm run lint",
  "pre-push": "npm run test"
}
```

### Advanced Configuration

**Simple array format:**

```json
{
  "git-hooks": {
    "pre-commit": ["npm run lint", "npm run typecheck", "npm run test"]
  }
}
```

**With parallel execution:**

```json
{
  "git-hooks": {
    "pre-commit": {
      "run": ["lint", "typecheck"],
      "parallel": true
    }
  }
}
```

**With ignore patterns:**

```json
{
  "git-hooks": {
    "pre-commit": {
      "run": "npm run test",
      "ignore": ["dist/", "node_modules/", "*.log"]
    }
  }
}
```

**Cross-platform with npm scripts:**

```json
{
  "scripts": {
    "lint": "eslint src/",
    "test": "jest",
    "typecheck": "tsc --noEmit"
  },
  "git-hooks": {
    "pre-commit": ["lint", "typecheck"],
    "pre-push": "test"
  }
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

### Parallel Execution

```typescript
runner.parallelExec(true)
runner.register({
  name: 'pre-commit',
  command: 'npm run lint && npm run typecheck',
  parallel: true,
})
```

### Using with lint-staged

```typescript
runner.register({
  name: 'pre-commit',
  command: 'npx lint-staged',
})
```

### Cross-Platform Scripts

```json
{
  "git-hooks": {
    "pre-commit": ["lint", "test"]
  },
  "scripts": {
    "lint": "eslint src/",
    "test": "jest"
  }
}
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `CI` | Enable CI mode (silent installation) |
| `GIT_HOOKS_SILENT` | Silent installation mode |
| `GIT_HOOKS_NO_COLOR` | Disable colored output |
| `NO_COLOR` | Standard no-color flag |

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests on GitHub.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Inspired by the original [git-hooks](https://github.com/typicode/git-hooks) package
- Built for the modern Node.js ecosystem
