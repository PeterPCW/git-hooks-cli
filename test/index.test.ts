import { describe, it, expect, beforeEach } from 'vitest'
import { GIT_HOOKS, HookRunner, createHookRunner } from '../src'

describe('GIT_HOOKS', () => {
  it('contains standard git hooks', () => {
    expect(GIT_HOOKS).toContain('pre-commit')
    expect(GIT_HOOKS).toContain('pre-push')
    expect(GIT_HOOKS).toContain('commit-msg')
    expect(GIT_HOOKS).toContain('post-commit')
  })

  it('has expected number of hooks', () => {
    expect(GIT_HOOKS.length).toBe(25)
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

  describe('run()', () => {
    it('returns false for non-existent hook', async () => {
      const result = await runner.run('pre-commit')
      expect(result).toBe(false)
    })

    it('returns true when command executes successfully', async () => {
      runner.register({
        name: 'pre-commit',
        command: process.execPath,
        args: ['-e', 'process.exit(0)']
      })
      const result = await runner.run('pre-commit', ['test'])
      expect(result).toBe(true)
    })
  })
})
