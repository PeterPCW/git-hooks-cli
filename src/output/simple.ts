// simple.ts - Zero-deps output formatter
import type { HookInfo } from '../commands/list.Types';

export function createSimpleView(hooks: HookInfo[]): string {
	if (hooks.length === 0) {
		return 'No git hooks found.';
	}

	const lines = hooks.map((h) => `  ${h.status}  ${h.name}`);
	return ['Git hooks:', ...lines].join('\n');
}
