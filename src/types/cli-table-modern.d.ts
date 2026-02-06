// Type declarations for cli-table-modern (lazy-loaded optional dependency)
export interface TableOptions {
	head?: string[];
	style?: {
		head?: string[];
		body?: string[];
		[key: string]: string[] | undefined;
	};
}

export function createTable(options: TableOptions): {
	push(rows: (string | undefined)[][]): void;
	toString(): string;
};
