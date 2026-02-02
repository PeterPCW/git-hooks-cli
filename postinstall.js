// postinstall.js - Cross-platform postinstall hook
import { existsSync } from 'fs';
import { fork } from 'child_process';

const cliPath = './bin/git-hooks.js';

if (existsSync(cliPath)) {
  fork(cliPath, ['install'], { stdio: 'inherit' });
} else {
  console.log('CLI not built yet, skipping git-hooks install');
}
