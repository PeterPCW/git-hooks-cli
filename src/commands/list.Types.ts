// list.Types.ts - TypeScript interfaces for git-hooks-cli
export interface HookInfo {
	name: string;
	status: '✓' | '✗';
	command: string;
}

export interface ListOptions {
	styled: boolean;
}
