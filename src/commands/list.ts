import * as fs from 'node:fs';
import * as path from 'node:path';
// list.ts - Business logic for listing git hooks
import { GIT_HOOKS, type HookInfo } from '../index';

const HOOKS_DIR = '.git/hooks';

export async function list(): Promise<HookInfo[]> {
	const hooks: HookInfo[] = [];
	const hookNames = GIT_HOOKS;

	for (const hookName of hookNames) {
		const hookPath = path.join(HOOKS_DIR, hookName);
		const executablePath = path.join(HOOKS_DIR, `${hookName}.sample`);

		let exists = false;
		let command = '';

		if (fs.existsSync(hookPath)) {
			exists = true;
			try {
				const content = fs.readFileSync(hookPath, 'utf-8');
				command = content.split('\n')[0] || '';
				if (command.startsWith('#!')) {
					command = content.split('\n')[1] || '';
				}
				command =
					command.trim().substring(0, 50) + (command.length > 50 ? '...' : '');
			} catch {
				command = '(error reading)';
			}
		} else if (fs.existsSync(executablePath)) {
			exists = true;
			command = '(sample hook)';
		}

		hooks.push({
			name: hookName,
			status: exists ? '✓' : '✗',
			command: exists ? command : '-'
		});
	}

	return hooks;
}
