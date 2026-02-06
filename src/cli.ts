// cli.ts - Entry point with --styled flag
import { list } from './commands/list';
import { createSimpleView, createStyledView } from './output';

export interface Args {
	styled: boolean;
}

export function parseArgs(): Args {
	const args = process.argv.slice(2);
	return {
		styled: args.includes('--styled') || args.includes('-s')
	};
}

export async function main() {
	const args = parseArgs();
	const hooks = await list();

	if (args.styled) {
		console.log(createStyledView(hooks));
	} else {
		console.log(createSimpleView(hooks));
	}
}

// Run main when executed directly
main().catch((err) => {
	console.error('Error:', err);
	process.exit(1);
});
