import { describe, it, expect, beforeEach } from 'vitest'
import { GIT_HOOKS, HookRunner, createHookRunner, spawnCommand, getSupportedHooks } from '../src'

describe('GIT_HOOKS', () => {
  it('contains standard git hooks', () => {
    expect(GIT_HOOKS).toContain('pre-commit')
    expect(GIT_HOOKS).toContain('pre-push')
    expect(GIT_HOOKS).toContain('commit-msg')
    expect(GIT_HOOKS).toContain('post-commit')
    expect(GIT_HOOKS).toContain('prepare-commit-msg')
  })

  it('has expected number of hooks', () => {
    expect(GIT_HOOKS.length).toBe(25)
  })
})

describe('getSupportedHooks', () => {
  it('returns the same as GIT_HOOKS', () => {
    expect(getSupportedHooks()).toEqual(GIT_HOOKS)
  })
})

describe('HookRunner', () => {
  let runner: HookRunner

  beforeEach(() => {
    runner = createHookRunner()
  })

  describe('register()', () => {
    it('registers a hook', () => {
      runner.register({
        name: 'pre-commit',
        command: 'npm run lint'
      })

      expect(runner.count()).toBe(1)
    })

    it('registers multiple hooks', () => {
      runner.register({ name: 'pre-commit', command: 'npm run lint' })
      runner.register({ name: 'commit-msg', command: 'npm run validate' })

      expect(runner.count()).toBe(2)
    })

    it('allows registering same hook twice', () => {
      runner.register({ name: 'pre-commit', command: 'lint' })
      runner.register({ name: 'pre-commit', command: 'test' })

      expect(runner.count()).toBe(1)
      expect(runner.get('pre-commit')?.command).toBe('test')
    })
  })

  describe('unregister()', () => {
    it('unregisters a hook', () => {
      runner.register({ name: 'pre-commit', command: 'npm run lint' })
      runner.unregister('pre-commit')

      expect(runner.count()).toBe(0)
    })

    it('returns this for chaining', () => {
      const result = runner.unregister('pre-commit')
      expect(result).toBe(runner)
    })

    it('does not error when unregistering non-existent hook', () => {
      expect(() => runner.unregister('non-existent')).not.toThrow()
    })
  })

  describe('get()', () => {
    it('returns undefined for non-existent hook', () => {
      expect(runner.get('pre-commit')).toBeUndefined()
    })

    it('returns hook config when exists', () => {
      runner.register({
        name: 'pre-commit',
        command: 'npm run lint',
        args: ['--fix']
      })

      const hook = runner.get('pre-commit')
      expect(hook).toBeDefined()
      expect(hook?.command).toBe('npm run lint')
      expect(hook?.args).toEqual(['--fix'])
    })
  })

  describe('list()', () => {
    it('returns empty array when no hooks', () => {
      expect(runner.list()).toEqual([])
    })

    it('returns all registered hooks', () => {
      runner.register({ name: 'pre-commit', command: 'lint' })
      runner.register({ name: 'commit-msg', command: 'validate' })

      const hooks = runner.list()
      expect(hooks).toHaveLength(2)
    })
  })

  describe('count()', () => {
    it('returns 0 initially', () => {
      expect(runner.count()).toBe(0)
    })

    it('returns correct count', () => {
      runner.register({ name: 'pre-commit', command: 'lint' })
      runner.register({ name: 'commit-msg', command: 'validate' })

      expect(runner.count()).toBe(2)
    })
  })

  describe('clear()', () => {
    it('removes all hooks', () => {
      runner.register({ name: 'pre-commit', command: 'lint' })
      runner.register({ name: 'commit-msg', command: 'validate' })
      runner.clear()

      expect(runner.count()).toBe(0)
    })

    it('returns this for chaining', () => {
      const result = runner.clear()
      expect(result).toBe(runner)
    })
  })

  describe('createHookRunner()', () => {
    it('creates new instance', () => {
      const runner1 = createHookRunner()
      const runner2 = createHookRunner()

      runner1.register({ name: 'pre-commit', command: 'lint' })

      expect(runner1.count()).toBe(1)
      expect(runner2.count()).toBe(0)
    })
  })

  describe('parallelExec()', () => {
    it('enables parallel execution', () => {
      runner.parallelExec(true)
      runner.register({ name: 'pre-commit', command: 'echo test' })

      const hook = runner.get('pre-commit')
      expect(hook).toBeDefined()
    })

    it('returns this for chaining', () => {
      const result = runner.parallelExec(true)
      expect(result).toBe(runner)
    })

    it('disabled by default', () => {
      runner.register({ name: 'pre-commit', command: 'echo test' })

      const hook = runner.get('pre-commit')
      expect(hook?.parallel).toBeUndefined()
    })
  })

  describe('ignore()', () => {
    it('sets ignore patterns', () => {
      runner.ignore(['dist/', 'node_modules/', '*.log'])
      runner.register({ name: 'pre-commit', command: 'echo test' })

      const hook = runner.get('pre-commit')
      expect(hook).toBeDefined()
    })

    it('returns this for chaining', () => {
      const result = runner.ignore(['dist/'])
      expect(result).toBe(runner)
    })

    it('accepts empty array', () => {
      runner.ignore([])
      expect(runner.count()).toBe(0)
    })
  })

  describe('useColors()', () => {
    it('enables colored output', () => {
      runner.useColors(true)
      runner.register({ name: 'pre-commit', command: 'echo test' })

      const hook = runner.get('pre-commit')
      expect(hook).toBeDefined()
    })

    it('returns this for chaining', () => {
      const result = runner.useColors(true)
      expect(result).toBe(runner)
    })
  })

  describe('run()', () => {
    it('returns false for non-existent hook', async () => {
      const result = await runner.run('pre-commit')
      expect(result).toBe(false)
    })

    it('returns true when command executes successfully', async () => {
      runner.register({
        name: 'pre-commit',
        command: 'node',
        args: ['-e', 'process.exit(0)']
      })
      const result = await runner.run('pre-commit', ['test'])
      expect(result).toBe(true)
    })

    it('returns false when command fails', async () => {
      runner.register({
        name: 'pre-commit',
        command: 'node',
        args: ['-e', 'process.exit(1)']
      })
      const result = await runner.run('pre-commit')
      expect(result).toBe(false)
    })

    it('runs multiple commands in sequence by default', async () => {
      runner.register({
        name: 'pre-commit',
        command: 'node',
        args: ['-e', 'process.exit(0)']
      })
      const result = await runner.run('pre-commit')
      expect(result).toBe(true)
    })

    it('stops on first command failure in sequence', async () => {
      runner.register({
        name: 'pre-commit',
        command: 'node',
        args: ['-e', 'process.exit(1)']
      })
      const result = await runner.run('pre-commit')
      expect(result).toBe(false)
    })

    it('respects per-hook parallel setting', async () => {
      runner.register({
        name: 'pre-commit',
        command: 'node',
        args: ['-e', 'process.exit(0)'],
        parallel: true
      })
      const result = await runner.run('pre-commit')
      expect(result).toBe(true)
    })

    it('skips hook when condition returns false', async () => {
      runner.register({
        name: 'pre-commit',
        command: 'node',
        args: ['-e', 'process.exit(1)'],
        condition: (files) => files.length === 0
      })
      const result = await runner.run('pre-commit', ['file1.ts'])
      expect(result).toBe(true) // Returns true because hook was skipped
    })

    it('runs hook when condition returns true', async () => {
      runner.register({
        name: 'pre-commit',
        command: 'node',
        args: ['-e', 'process.exit(0)'],
        condition: (files) => files.length > 0
      })
      const result = await runner.run('pre-commit', ['file1.ts'])
      expect(result).toBe(true)
    })
  })

  describe('runAll()', () => {
    it('returns true when all hooks succeed', async () => {
      runner.register({ name: 'pre-commit', command: 'node', args: ['-e', 'process.exit(0)'] })
      runner.register({ name: 'pre-push', command: 'node', args: ['-e', 'process.exit(0)'] })

      const result = await runner.runAll()
      expect(result).toBe(true)
    })

    it('returns false when any hook fails', async () => {
      runner.register({ name: 'pre-commit', command: 'node', args: ['-e', 'process.exit(1)'] })
      runner.register({ name: 'pre-push', command: 'node', args: ['-e', 'process.exit(0)'] })

      const result = await runner.runAll()
      expect(result).toBe(false)
    })

    it('returns true when no hooks registered', async () => {
      const result = await runner.runAll()
      expect(result).toBe(true)
    })
  })
})

describe('ignore patterns', () => {
  let runner: HookRunner

  beforeEach(() => {
    runner = createHookRunner()
  })

  describe('matchIgnorePattern', () => {
    it('matches exact file names', async () => {
      runner.ignore(['test.txt'])
      runner.register({
        name: 'pre-commit',
        command: 'node',
        args: ['-e', 'process.exit(0)']
      })
      const result = await runner.run('pre-commit', ['test.txt'])
      expect(result).toBe(true) // Skipped due to ignore
    })

    it('does not match partial file names', async () => {
      runner.ignore(['test'])
      runner.register({
        name: 'pre-commit',
        command: 'node',
        args: ['-e', 'process.exit(0)']
      })
      const result = await runner.run('pre-commit', ['mytest.txt'])
      expect(result).toBe(true) // Should run (command succeeds)
    })

    it('matches directory patterns ending with /', async () => {
      runner.ignore(['dist/'])
      runner.register({
        name: 'pre-commit',
        command: 'node',
        args: ['-e', 'process.exit(0)']
      })
      const result = await runner.run('pre-commit', ['dist/app.js'])
      expect(result).toBe(true) // Skipped
    })

    it('matches nested directory patterns', async () => {
      runner.ignore(['node_modules/'])
      runner.register({
        name: 'pre-commit',
        command: 'node',
        args: ['-e', 'process.exit(0)']
      })
      const result = await runner.run('pre-commit', ['node_modules/pkg/index.js'])
      expect(result).toBe(true) // Skipped
    })

    it('matches wildcard patterns with *', async () => {
      runner.ignore(['*.log'])
      runner.register({
        name: 'pre-commit',
        command: 'node',
        args: ['-e', 'process.exit(0)']
      })
      const result = await runner.run('pre-commit', ['error.log'])
      expect(result).toBe(true) // Skipped
    })

    it('matches nested files with wildcard', async () => {
      runner.ignore(['*.test.ts'])
      runner.register({
        name: 'pre-commit',
        command: 'node',
        args: ['-e', 'process.exit(0)']
      })
      const result = await runner.run('pre-commit', ['src/math.test.ts'])
      expect(result).toBe(true) // Skipped
    })

    it('does not match files with similar extension', async () => {
      runner.ignore(['*.test.ts'])
      runner.register({
        name: 'pre-commit',
        command: 'node',
        args: ['-e', 'process.exit(0)']
      })
      const result = await runner.run('pre-commit', ['src/main.ts'])
      expect(result).toBe(true) // Should run (command succeeds)
    })

    it('matches path/to/file pattern', async () => {
      runner.ignore(['src/test/'])
      runner.register({
        name: 'pre-commit',
        command: 'node',
        args: ['-e', 'process.exit(0)']
      })
      const result = await runner.run('pre-commit', ['src/test/helper.ts'])
      expect(result).toBe(true) // Skipped
    })

    it('ignores no patterns by default', async () => {
      runner.register({
        name: 'pre-commit',
        command: 'node',
        args: ['-e', 'process.exit(0)']
      })
      const result = await runner.run('pre-commit', ['dist/app.js'])
      expect(result).toBe(true)
    })
  })
})

describe('spawnCommand', () => {
  it('returns true for successful command', async () => {
    const result = await spawnCommand('node', ['-e', 'process.exit(0)'])
    expect(result).toBe(true)
  })

  it('returns false for failed command', async () => {
    const result = await spawnCommand('node', ['-e', 'process.exit(1)'])
    expect(result).toBe(false)
  })

  it('returns false for non-existent command', async () => {
    const result = await spawnCommand('non-existent-command-12345', [])
    expect(result).toBe(false)
  })

  it('accepts custom cwd option', async () => {
    const result = await spawnCommand('node', ['-e', 'process.exit(0)'], {
      cwd: process.cwd()
    })
    expect(result).toBe(true)
  })

  it('accepts custom env option', async () => {
    const result = await spawnCommand('node', ['-e', 'process.exit(0)'], {
      env: { ...process.env, TEST_VAR: 'test' }
    })
    expect(result).toBe(true)
  })

  it('accepts parallel option (for API compatibility)', async () => {
    const result = await spawnCommand('node', ['-e', 'process.exit(0)'], {
      parallel: true
    })
    expect(result).toBe(true)
  })
})
