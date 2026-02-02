#!/usr/bin/env node
/**
 * git-hooks-cli - Modern git hooks manager
 */
import { dirname, join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
const PACKAGE_VERSION = '0.0.1';
// Get __dirname in ESM
const __dirname = dirname(fileURLToPath(import.meta.url));
/**
 * Get the git directory path
 */
function getGitDir() {
    let currentDir = process.cwd();
    const maxDepth = 10;
    let depth = 0;
    while (depth < maxDepth) {
        const gitDir = join(currentDir, '.git');
        if (existsSync(gitDir)) {
            return gitDir;
        }
        const parent = dirname(currentDir);
        if (parent === currentDir)
            break;
        currentDir = parent;
        depth++;
    }
    return null;
}
/**
 * Read hooks configuration from package.json
 */
function getConfigFromPackageJson() {
    const packageJsonPath = join(process.cwd(), 'package.json');
    if (!existsSync(packageJsonPath)) {
        return null;
    }
    try {
        const content = readFileSync(packageJsonPath, 'utf-8');
        const pkg = JSON.parse(content);
        return pkg['git-hooks'] || null;
    }
    catch {
        return null;
    }
}
/**
 * Read hooks configuration from .git-hooksrc
 */
function getConfigFromGitHookrc() {
    const configPath = join(process.cwd(), '.git-hooksrc');
    if (!existsSync(configPath)) {
        return null;
    }
    try {
        const content = readFileSync(configPath, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return null;
    }
}
/**
 * Get all configured hooks
 */
function getConfiguredHooks() {
    return getConfigFromPackageJson() || getConfigFromGitHookrc() || {};
}
/**
 * Show help message
 */
function showHelp() {
    console.log(`
git-hooks-cli v${PACKAGE_VERSION} - Modern git hooks manager

Usage: git-hooks <command> [options]

Commands:
  install [hook-name]   Install git hooks (all or specific hook)
  uninstall [hook-name] Remove git hooks (all or specific hook)
  list                  List all configured hooks
  run <hook-name>       Run a hook manually
  status                Check installed hooks status

Options:
  -h, --help            Show this help message
  -v, --version         Show version

Examples:
  git-hooks install pre-commit
  git-hooks install          # Install all configured hooks
  git-hooks uninstall pre-commit
  git-hooks list
  git-hooks run pre-commit
`);
}
/**
 * Show version
 */
function showVersion() {
    console.log(`git-hooks-cli v${PACKAGE_VERSION}`);
}
/**
 * Generate hook script content
 */
function generateHookScript(hookName, command) {
    if (process.platform === 'win32') {
        // Windows batch file
        return `@echo off
REM git-hooks-cli generated hook: ${hookName}
REM DO NOT EDIT MANUALLY

node "%~dp0..\..\node_modules\.bin\git-hooks" run "${hookName}" %*
if %errorlevel% neq 0 exit /b %errorlevel%
`;
    }
    else {
        // Unix shell script
        return `#!/bin/sh
# git-hooks-cli generated hook: ${hookName}
# DO NOT EDIT MANUALLY

exec npx git-hooks run "${hookName}" "$@"
`;
    }
}
/**
 * Install a hook
 */
function installHook(hookName, silent = false) {
    // Check for CI/silent mode from environment
    const isSilent = silent || process.env.CI || process.env.GIT_HOOKS_SILENT;
    const gitDir = getGitDir();
    if (!gitDir) {
        if (isSilent)
            return; // Silent mode: just skip if not in git repo
        console.error('Error: Not in a git repository (.git directory not found)');
        process.exit(1);
    }
    const hooksDir = join(gitDir, 'hooks');
    if (!existsSync(hooksDir)) {
        mkdirSync(hooksDir, { recursive: true });
    }
    const config = getConfiguredHooks();
    const hookNames = hookName ? [hookName] : Object.keys(config);
    if (hookNames.length === 0) {
        console.log('No hooks configured. Add hooks to package.json["git-hooks"] or .git-hooksrc');
        return;
    }
    const isWindows = process.platform === 'win32';
    for (const name of hookNames) {
        const hookConfig = config[name];
        if (!hookConfig) {
            console.warn(`Warning: Hook "${name}" not found in configuration`);
            continue;
        }
        // Add .cmd extension on Windows
        const hookFileName = isWindows ? `${name}.cmd` : name;
        const hookPath = join(hooksDir, hookFileName);
        const command = Array.isArray(hookConfig) ? hookConfig.join(' && ') : hookConfig;
        writeFileSync(hookPath, generateHookScript(name, command), isWindows ? undefined : { mode: 0o755 });
        console.log(`Installed: ${hookPath}`);
    }
    console.log('\nHooks installed successfully!');
}
/**
 * Uninstall a hook
 */
function uninstallHook(hookName) {
    const gitDir = getGitDir();
    if (!gitDir) {
        console.error('Error: Not in a git repository (.git directory not found)');
        process.exit(1);
    }
    const hooksDir = join(gitDir, 'hooks');
    if (!existsSync(hooksDir)) {
        console.log('No hooks directory found');
        return;
    }
    const config = getConfiguredHooks();
    const isWindows = process.platform === 'win32';
    // Helper to get hook file path (with .cmd extension on Windows)
    const getHookPath = (name) => join(hooksDir, isWindows ? `${name}.cmd` : name);
    if (hookName) {
        const hookPath = getHookPath(hookName);
        if (existsSync(hookPath)) {
            rmSync(hookPath);
            console.log(`Uninstalled: ${hookPath}`);
        }
        else {
            console.warn(`Hook "${hookName}" not found`);
        }
    }
    else {
        // Uninstall all hooks that match our config
        let removed = 0;
        for (const name of Object.keys(config)) {
            const hookPath = getHookPath(name);
            if (existsSync(hookPath)) {
                rmSync(hookPath);
                removed++;
            }
        }
        console.log(`Uninstalled ${removed} hook(s)`);
    }
}
/**
 * List configured hooks
 */
function listHooks() {
    const config = getConfiguredHooks();
    const gitDir = getGitDir();
    const isWindows = process.platform === 'win32';
    console.log('Configured hooks:');
    console.log('');
    if (Object.keys(config).length === 0) {
        console.log('  No hooks configured');
        console.log('');
        console.log('Add hooks to package.json["git-hooks"] or .git-hooksrc');
        return;
    }
    // Helper to get hook file path (with .cmd extension on Windows)
    const getHookPath = (name) => join(gitDir || '', 'hooks', isWindows ? `${name}.cmd` : name);
    for (const [name, command] of Object.entries(config)) {
        const commandStr = Array.isArray(command) ? command.join(' && ') : command;
        let status = '';
        if (gitDir) {
            const hookPath = getHookPath(name);
            status = existsSync(hookPath) ? ' [installed]' : ' [not installed]';
        }
        console.log(`  ${name}: ${commandStr}${status}`);
    }
}
/**
 * Check hook status
 */
function checkStatus() {
    const gitDir = getGitDir();
    const config = getConfiguredHooks();
    const isWindows = process.platform === 'win32';
    console.log('Hook status:');
    console.log('');
    if (!gitDir) {
        console.log('  Not in a git repository');
        return;
    }
    const hooksDir = join(gitDir, 'hooks');
    if (!existsSync(hooksDir)) {
        console.log('  .git/hooks directory does not exist');
        return;
    }
    // Get hook files (no extension on Unix, .cmd on Windows)
    const getHookFileName = (name) => isWindows ? `${name}.cmd` : name;
    const installedHooks = existsSync(hooksDir) ? readdirSync(hooksDir)
        .filter(f => !f.endsWith('.sample'))
        .filter(f => {
        // On Windows, only show .cmd files; on Unix, show files without extensions
        if (isWindows) {
            return f.endsWith('.cmd');
        }
        else {
            return !f.includes('.');
        }
    })
        .map(f => isWindows ? f.replace(/\.cmd$/, '') : f) : [];
    if (installedHooks.length === 0 && Object.keys(config).length === 0) {
        console.log('  No hooks installed or configured');
        return;
    }
    // Show installed hooks
    console.log('Installed hooks:');
    for (const hook of installedHooks) {
        console.log(`  [x] ${hook}`);
    }
    // Show configured but not installed
    const configuredNotInstalled = Object.keys(config).filter(h => !installedHooks.includes(h));
    if (configuredNotInstalled.length > 0) {
        console.log('\nConfigured but not installed:');
        for (const hook of configuredNotInstalled) {
            console.log(`  [ ] ${hook}`);
        }
    }
    // Show installed but not configured
    const installedNotConfigured = installedHooks.filter(h => !Object.keys(config).includes(h));
    if (installedNotConfigured.length > 0) {
        console.log('\nInstalled but not configured (may be from other sources):');
        for (const hook of installedNotConfigured) {
            console.log(`  [?] ${hook}`);
        }
    }
}
/**
 * Run a hook manually
 */
function runHook(hookName, args) {
    const config = getConfiguredHooks();
    const hookConfig = config[hookName];
    if (!hookConfig) {
        console.error(`Error: Hook "${hookName}" not found in configuration`);
        process.exit(1);
    }
    const commands = Array.isArray(hookConfig) ? hookConfig : [hookConfig];
    console.log(`Running hook: ${hookName}`);
    console.log(`Args: ${args.join(' ') || '(none)'}`);
    console.log('');
    let success = true;
    for (const command of commands) {
        try {
            console.log(`$ ${command}`);
            execSync(command, {
                stdio: 'inherit',
                cwd: process.cwd(),
                env: { ...process.env }
            });
        }
        catch {
            success = false;
            console.error(`Command failed: ${command}`);
        }
    }
    process.exit(success ? 0 : 1);
}
/**
 * Main CLI entry point
 */
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    if (!command || command === 'help' || command === '--help' || command === '-h') {
        showHelp();
        return;
    }
    if (command === 'version' || command === '--version' || command === '-v') {
        showVersion();
        return;
    }
    switch (command) {
        case 'install':
        case 'add':
        case 'enable':
            installHook(args[1]);
            break;
        case 'uninstall':
        case 'remove':
        case 'disable':
            uninstallHook(args[1]);
            break;
        case 'list':
        case 'ls':
            listHooks();
            break;
        case 'status':
            checkStatus();
            break;
        case 'run':
            if (!args[1]) {
                console.error('Error: Hook name required');
                console.error('Usage: git-hooks run <hook-name>');
                process.exit(1);
            }
            runHook(args[1], args.slice(2));
            break;
        default:
            console.error('Unknown command: ' + command);
            showHelp();
            process.exit(1);
    }
}
main().catch((error) => {
    console.error('Error:', error.message);
    // In CI/silent mode, always exit with 0 to avoid install failures
    if (process.env.CI || process.env.GIT_HOOKS_SILENT) {
        process.exit(0);
    }
    process.exit(1);
});
