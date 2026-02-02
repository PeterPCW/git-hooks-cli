# Contributing to git-hooks-cli

Thank you for your interest in contributing! This document outlines the process for contributing to this project.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- pnpm (recommended) or npm

### Development Setup

1. Fork this repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/git-hooks-cli.git
   cd git-hooks-cli
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Run tests:
   ```bash
   pnpm test
   ```

5. Build the project:
   ```bash
   pnpm build
   ```

## Making Changes

1. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. Make your changes following the coding standards:
   - TypeScript for all source files
   - ESLint for code linting
   - Prettier for code formatting

3. Add tests for your changes if applicable

4. Run the test suite to ensure everything passes:
   ```bash
   pnpm test
   ```

5. Commit your changes with a clear commit message

6. Push to your fork and submit a pull request

## Code Style

This project uses:
- **TypeScript** for type safety
- **ESLint** for linting
- **Prettier** for formatting

Run formatting and linting:
```bash
pnpm format
pnpm lint
```

## Testing

Write tests for new functionality using Vitest:

```typescript
import { describe, it, expect } from 'vitest'

describe('HookRunner', () => {
  it('should register a hook', () => {
    const runner = createHookRunner()
    runner.register({ name: 'test', command: 'echo test' })
    expect(runner.get('test')).toBeDefined()
  })
})
```

Run tests with coverage:
```bash
pnpm test:coverage
```

## Pull Request Guidelines

- Fill in the provided PR template completely
- Ensure all tests pass
- Ensure code is properly formatted
- Link any related issues
- Describe your changes clearly

## Reporting Issues

When reporting issues, please include:

1. A clear description of the problem
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Node.js version and operating system
6. Any relevant error messages or logs

## Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Questions?

Feel free to open an issue for questions about contributing or using the project.
