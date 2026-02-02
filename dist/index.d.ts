/**
 * Create a new hook runner
 */
export declare function createHookRunner(): HookRunner;

/**
 * Define configuration for git-hooks-cli
 */
export declare function defineConfig(config: Record<string, unknown>): Record<string, unknown>;

/**
 * Standard git hooks
 */
export declare const GIT_HOOKS: readonly ["applypatch-msg", "commit-msg", "fsmonitor-watchman", "post-applypatch", "post-checkout", "post-commit", "post-merge", "post-receive", "post-rewrite", "post-update", "pre-applypatch", "pre-auto-gc", "pre-checkout", "pre-commit", "pre-merge-commit", "pre-push", "pre-rebase", "pre-receive", "prepare-commit-msg", "push-to-checkout", "reference-transaction", "sendemail-validate", "shallow-clone", "update", "worktree-guid"];

export declare type GitHook = typeof GIT_HOOKS[number];

/**
 * Hook configuration options
 */
export declare interface HookConfig {
    name: string;
    command: string;
    args?: string[];
    condition?: (files: string[]) => boolean;
}

/**
 * Hook runner
 */
export declare class HookRunner {
    private hooks;
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
     * Run a hook
     */
    run(name: string, args?: string[]): Promise<boolean>;
    /**
     * Clear all hooks
     */
    clear(): this;
    /**
     * Get hook count
     */
    count(): number;
}

export { }
