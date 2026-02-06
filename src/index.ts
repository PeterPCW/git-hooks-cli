/**
 * Git hooks manager utilities
 */
export { HookInfo, ListOptions } from './commands/list.Types';
export { list } from './commands/list';

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
	'worktree-guid'
] as const;

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
export class HookRunner {
	private hooks: Map<string, HookConfig> = new Map();
	private parallel = false;
	private ignorePatterns: string[] = [];
	private color = false;

	/**
	 * Enable parallel execution
	 */
	parallelExec(enabled = true): this {
		this.parallel = enabled;
		return this;
	}

	/**
	 * Set ignore patterns
	 */
	ignore(patterns: string[]): this {
		this.ignorePatterns = patterns;
		return this;
	}

	/**
	 * Enable colored output
	 */
	useColors(enabled = true): this {
		this.color = enabled;
		return this;
	}

	/**
	 * Register a hook
	 */
	register(config: HookConfig): this {
		this.hooks.set(config.name, config);
		return this;
	}

	/**
	 * Unregister a hook
	 */
	unregister(name: string): this {
		this.hooks.delete(name);
		return this;
	}

	/**
	 * Get registered hook
	 */
	get(name: string): HookConfig | undefined {
		return this.hooks.get(name);
	}

	/**
	 * List all registered hooks
	 */
	list(): HookConfig[] {
		return Array.from(this.hooks.values());
	}

	/**
	 * Check if files match ignore patterns
	 */
	private shouldIgnore(files: string[]): boolean {
		if (this.ignorePatterns.length === 0) return false;
		return files.some((file) =>
			this.ignorePatterns.some((pattern) =>
				this.matchIgnorePattern(file, pattern)
			)
		);
	}

	/**
	 * Match a file against an ignore pattern
	 */
	private matchIgnorePattern(file: string, pattern: string): boolean {
		// Handle directory patterns ending with /
		if (pattern.endsWith('/')) {
			const dirPattern = pattern.slice(0, -1);
			return (
				file.startsWith(pattern) ||
				file.includes(`/${dirPattern}/`) ||
				file.endsWith(`/${dirPattern}`)
			);
		}

		// Handle wildcard patterns
		if (pattern.includes('*')) {
			// Convert glob pattern to regex
			const regexPattern = pattern
				.replace(/\./g, '\\.')
				.replace(/\*\*/g, '§§§') // Temporary placeholder for **
				.replace(/\*/g, '[^/]*')
				.replace(/§§§/g, '.*');
			const regex = new RegExp(`^${regexPattern}$`);
			return regex.test(file);
		}

		// Exact match or path match
		return (
			file === pattern ||
			file.endsWith(`/${pattern}`) ||
			file.includes(`/${pattern}/`)
		);
	}

	/**
	 * Run a single command
	 */
	private async runCommand(
		command: string,
		args: string[] = []
	): Promise<boolean> {
		try {
			const { spawn } = await import('node:child_process');
			const isWin = process.platform === 'win32';

			// On Windows, we need to invoke through cmd.exe for proper shell behavior
			// On Linux, we only need shell for compound commands (&&, ||)
			const needsShell =
				isWin || command.includes('&&') || command.includes('||');

			const spawnArgs = needsShell
				? isWin
					? ['/c', command, ...args] // Windows: cmd /c <command> <args>
					: ['-c', command, ...args] // Linux: sh -c <command> <args>
				: args;

			const spawnCmd = needsShell ? (isWin ? 'cmd.exe' : '/bin/sh') : command;

			return new Promise((resolve) => {
				const proc = spawn(spawnCmd, spawnArgs, {
					stdio: 'pipe',
					cwd: process.cwd(),
					env: { ...process.env, FORCE_COLOR: this.color ? '1' : undefined }
				});

				let stdout = '';
				let stderr = '';

				proc.stdout?.on('data', (data) => {
					stdout += data;
					process.stdout.write(data);
				});

				proc.stderr?.on('data', (data) => {
					stderr += data;
					process.stderr.write(data);
				});

				proc.on('close', (code) => {
					resolve(code === 0);
				});

				proc.on('error', () => {
					resolve(false);
				});

				proc.stdin?.end();
			});
		} catch {
			return false;
		}
	}

	/**
	 * Run a hook
	 */
	async run(name: string, args: string[] = []): Promise<boolean> {
		const hook = this.hooks.get(name);
		if (!hook) {
			return false;
		}

		// Check ignore patterns
		if (this.shouldIgnore(args)) {
			return true;
		}

		// Check condition if provided
		if (hook.condition && !hook.condition(args)) {
			return true;
		}

		const commands = hook.command.split('&&').map((c) => c.trim());

		// Use per-hook parallel setting if available, otherwise use runner default
		const shouldParallel =
			(hook.parallel ?? this.parallel) && commands.length > 1;

		if (shouldParallel) {
			// Run commands in parallel
			const results = await Promise.all(
				commands.map((cmd) => this.runCommand(cmd, hook.args))
			);
			return results.every((r) => r);
		}

		// Run sequentially (default)
		for (const cmd of commands) {
			const success = await this.runCommand(cmd, hook.args);
			if (!success) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Run all hooks
	 */
	async runAll(args: string[] = []): Promise<boolean> {
		let allSuccess = true;
		for (const hook of this.hooks.values()) {
			const success = await this.run(hook.name, args);
			if (!success) {
				allSuccess = false;
			}
		}
		return allSuccess;
	}

	/**
	 * Clear all hooks
	 */
	clear(): this {
		this.hooks.clear();
		return this;
	}

	/**
	 * Get hook count
	 */
	count(): number {
		return this.hooks.size;
	}
}

/**
 * Create a new hook runner
 */
export function createHookRunner(): HookRunner {
	return new HookRunner();
}

/**
 * Define configuration for git-hooks-cli
 */
export function defineConfig(
	config: Record<string, unknown>
): Record<string, unknown> {
	return config;
}

/**
 * Cross-platform spawn helper
 */
export async function spawnCommand(
	command: string,
	args: string[] = [],
	options: {
		cwd?: string;
		env?: Record<string, string>;
		parallel?: boolean;
	} = {}
): Promise<boolean> {
	const { spawn } = await import('node:child_process');
	const isWin = process.platform === 'win32';

	// On Windows, we need to invoke through cmd.exe for proper shell behavior
	// On Linux, we only need shell for compound commands (&&, ||)
	const needsShell = isWin || command.includes('&&') || command.includes('||');

	const spawnArgs = needsShell
		? isWin
			? ['/c', command, ...args] // Windows: cmd /c <command> <args>
			: ['-c', command, ...args] // Linux: sh -c <command> <args>
		: args;

	const spawnCmd = needsShell ? (isWin ? 'cmd.exe' : '/bin/sh') : command;

	return new Promise((resolve) => {
		const proc = spawn(spawnCmd, spawnArgs, {
			stdio: 'pipe',
			cwd: options.cwd || process.cwd(),
			env: { ...process.env, ...options.env }
		});

		proc.stdout?.on('data', (data) => process.stdout.write(data));
		proc.stderr?.on('data', (data) => process.stderr.write(data));

		proc.on('close', (code) => {
			resolve(code === 0);
		});

		proc.on('error', () => {
			resolve(false);
		});

		proc.stdin?.end();
	});
}

/**
 * Get all supported git hooks as a typed array
 */
export function getSupportedHooks(): readonly GitHook[] {
	return GIT_HOOKS;
}
