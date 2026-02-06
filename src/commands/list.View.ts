import { createSimpleView } from '../output/simple';
// list.View.ts - Output formatting with lazy loading
import type { HookInfo } from './list.Types';

// Re-export for convenience
export { HookInfo } from './list.Types';

// Type for cli-table-modern (lazy-loaded optional dependency)
interface TableInstance {
	push(rows: (string | undefined)[][]): void;
	toString(): string;
}

export function createStyledView(hooks: HookInfo[]): string {
	let tableModule: {
		createTable: (opts: {
			head?: string[];
			style?: { head?: string[] };
		}) => TableInstance;
	};

	try {
		tableModule = require('cli-table-modern');
	} catch {
		return `${createSimpleView(hooks)}\n\n⚠️  Install cli-table-modern for styled output:\n   npm install cli-table-modern`;
	}

	const table = tableModule.createTable({
		head: ['Hook', 'Status', 'Command'],
		style: { head: ['cyan', 'bold'] } as {
			head?: string[];
			[key: string]: string[] | undefined;
		}
	});

	for (const h of hooks) {
		table.push([[h.name], [h.status], [h.command]]);
	}

	return table.toString();
}
