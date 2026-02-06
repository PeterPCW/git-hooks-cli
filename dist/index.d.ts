/**
 * Git hooks manager utilities
 */
export { HookInfo, ListOptions } from './commands/list.Types';
export { list } from './commands/list';
/**
 * Standard git hooks
 */
export declare const GIT_HOOKS: readonly ["applypatch-msg", "commit-msg", "fsmonitor-watchman", "post-applypatch", "post-checkout", "post-commit", "post-merge", "post-receive", "post-rewrite", "post-update", "pre-applypatch", "pre-auto-gc", "pre-checkout", "pre-commit", "pre-merge-commit", "pre-push", "pre-rebase", "pre-receive", "prepare-commit-msg", "push-to-checkout", "reference-transaction", "sendemail-validate", "shallow-clone", "update", "worktree-guid"];
export type GitHook = (typeof GIT_HOOKS)[number];
/**
 * Hook configuration options
 */
export interface HookConfig {
    name: string;
    command: string;
    args?: string[];
    condition?: (files: string[]) => boolean;
    parallel?: boolean;
}
/**
 * Hook runner
 */
export declare class HookRunner {
    private hooks;
    private parallel;
    private ignorePatterns;
    private color;
    /**
     * Enable parallel execution
     */
    parallelExec(enabled?: boolean): this;
    /**
     * Set ignore patterns
     */
    ignore(patterns: string[]): this;
    /**
     * Enable colored output
     */
    useColors(enabled?: boolean): this;
    /**
     * Register a hook
     */
    register(config: HookConfig): this;
    /**
     * Unregister a hook
     */
    unregister(name: string): this;
    /**
     * Get registered hook
     */
    get(name: string): HookConfig | undefined;
    /**
     * List all registered hooks
     */
    list(): HookConfig[];
    /**
     * Check if files match ignore patterns
     */
    private shouldIgnore;
    /**
     * Match a file against an ignore pattern
     */
    private matchIgnorePattern;
    /**
     * Run a single command
     */
    private runCommand;
    /**
     * Run a hook
     */
    run(name: string, args?: string[]): Promise<boolean>;
    /**
     * Run all hooks
     */
    runAll(args?: string[]): Promise<boolean>;
    /**
     * Clear all hooks
     */
    clear(): this;
    /**
     * Get hook count
     */
    count(): number;
}
/**
 * Create a new hook runner
 */
export declare function createHookRunner(): HookRunner;
/**
 * Define configuration for git-hooks-cli
 */
export declare function defineConfig(config: Record<string, unknown>): Record<string, unknown>;
/**
 * Cross-platform spawn helper
 */
export declare function spawnCommand(command: string, args?: string[], options?: {
    cwd?: string;
    env?: Record<string, string>;
    parallel?: boolean;
}): Promise<boolean>;
/**
 * Get all supported git hooks as a typed array
 */
export declare function getSupportedHooks(): readonly GitHook[];
