/**
 * Git hooks manager utilities
 */

/**
 * Standard git hooks
 */
export const GIT_HOOKS = [
  'applypatch-msg',
  'commit-msg',
  'fsmonitor-watchman',
  'post-applypatch',
  'post-checkout',
  'post-commit',
  'post-merge',
  'post-receive',
  'post-rewrite',
  'post-update',
  'pre-applypatch',
  'pre-auto-gc',
  'pre-checkout',
  'pre-commit',
  'pre-merge-commit',
  'pre-push',
  'pre-rebase',
  'pre-receive',
  'prepare-commit-msg',
  'push-to-checkout',
  'reference-transaction',
  'sendemail-validate',
  'shallow-clone',
  'update',
  'worktree-guid',
] as const

export type GitHook = typeof GIT_HOOKS[number]

/**
 * Hook configuration options
 */
export interface HookConfig {
  name: string
  command: string
  args?: string[]
  condition?: (files: string[]) => boolean
}

/**
 * Hook runner
 */
export class HookRunner {
  private hooks: Map<string, HookConfig> = new Map()

  /**
   * Register a hook
   */
  register(config: HookConfig): this {
    this.hooks.set(config.name, config)
    return this
  }

  /**
   * Unregister a hook
   */
  unregister(name: string): this {
    this.hooks.delete(name)
    return this
  }

  /**
   * Get registered hook
   */
  get(name: string): HookConfig | undefined {
    return this.hooks.get(name)
  }

  /**
   * List all registered hooks
   */
  list(): HookConfig[] {
    return Array.from(this.hooks.values())
  }

  /**
   * Run a hook
   */
  async run(name: string, args: string[] = []): Promise<boolean> {
    const hook = this.hooks.get(name)
    if (!hook) {
      return false
    }

    const command = hook.command
    const hookArgs = [...(hook.args || []), ...args]

    try {
      const { spawn } = await import('child_process')
      return new Promise((resolve) => {
        const proc = spawn(command, hookArgs, {
          stdio: 'pipe',
          cwd: process.cwd(),
          env: { ...process.env }
        })

        let stdout = ''
        let stderr = ''

        proc.stdout?.on('data', (data) => {
          stdout += data
          process.stdout.write(data)
        })

        proc.stderr?.on('data', (data) => {
          stderr += data
          process.stderr.write(data)
        })

        proc.on('close', (code) => {
          resolve(code === 0)
        })

        proc.on('error', () => {
          resolve(false)
        })

        proc.stdin?.end()
      })
    } catch {
      return false
    }
  }

  /**
   * Clear all hooks
   */
  clear(): this {
    this.hooks.clear()
    return this
  }

  /**
   * Get hook count
   */
  count(): number {
    return this.hooks.size
  }
}

/**
 * Create a new hook runner
 */
export function createHookRunner(): HookRunner {
  return new HookRunner()
}

/**
 * Define configuration for git-hooks-cli
 */
export function defineConfig(config: Record<string, unknown>): Record<string, unknown> {
  return config
}
