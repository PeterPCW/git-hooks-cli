#!/usr/bin/env node

/**
 * git-hooks-cli - Modern git hooks manager
 */

import { dirname, join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { execSync, exec, ExecOptions } from 'child_process'

const PACKAGE_VERSION = '0.1.0'

// Get __dirname in ESM
const __dirname = dirname(fileURLToPath(import.meta.url))

// Colors for cross-platform output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
}

function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`
}

function supportsColor(): boolean {
  // Check CI environment
  if (process.env.CI || process.env.NO_COLOR || process.env.GIT_HOOKS_NO_COLOR) {
    return false
  }
  // Check TTY
  return process.stdout.isTTY === true
}

/**
 * Get the git directory path
 */
function getGitDir(): string | null {
  let currentDir = process.cwd()
  const maxDepth = 10
  let depth = 0

  while (depth < maxDepth) {
    const gitDir = join(currentDir, '.git')
    if (existsSync(gitDir)) {
      return gitDir
    }
    const parent = dirname(currentDir)
    if (parent === currentDir) break
    currentDir = parent
    depth++
  }
  return null
}

/**
 * Resolve a script name to its command
 */
function resolveScript(scriptName: string, pkg: Record<string, unknown>): string {
  const scripts = pkg.scripts as Record<string, string> | undefined
  if (scripts && scripts[scriptName]) {
    return `npm run ${scriptName}`
  }
  return scriptName
}

/**
 * Read hooks configuration from package.json
 */
function getConfigFromPackageJson(): Record<string, unknown> | null {
  const packageJsonPath = join(process.cwd(), 'package.json')
  if (!existsSync(packageJsonPath)) {
    return null
  }
  try {
    const content = readFileSync(packageJsonPath, 'utf-8')
    const pkg = JSON.parse(content)
    return pkg['git-hooks'] || null
  } catch {
    return null
  }
}

/**
 * Read hooks configuration from .git-hookrc
 */
function getConfigFromGitHookrc(): Record<string, unknown> | null {
  const configPath = join(process.cwd(), '.git-hookrc')
  if (!existsSync(configPath)) {
    return null
  }
  try {
    const content = readFileSync(configPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

/**
 * Get all configured hooks
 */
function getConfiguredHooks(): Record<string, unknown> {
  return getConfigFromPackageJson() || getConfigFromGitHookrc() || {}
}

/**
 * Get package.json contents
 */
function getPackageJson(): Record<string, unknown> | null {
  const packageJsonPath = join(process.cwd(), 'package.json')
  if (!existsSync(packageJsonPath)) {
    return null
  }
  try {
    return JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
  } catch {
    return null
  }
}

/**
 * Show help message
 */
function showHelp(): void {
  const useColors = supportsColor()
  const title = (text: string) => useColors ? colorize(text, 'cyan') : text
  const cmd = (text: string) => useColors ? colorize(text, 'green') : text
  const opt = (text: string) => useColors ? colorize(text, 'gray') : text

  console.log(`
${title('git-hooks-cli')} v${PACKAGE_VERSION} - Modern git hooks manager

${title('Usage:')} git-hooks <command> [options]

${title('Commands:')}
  ${cmd('install')} [hook-name]   Install git hooks (all or specific hook)
  ${cmd('uninstall')} [hook-name] Remove git hooks (all or specific hook)
  ${cmd('list')}                  List all configured hooks
  ${cmd('status')}                Check installed hooks status
  ${cmd('check')}                 Validate configuration
  ${cmd('run')} <hook-name>       Run a hook manually

${title('Options:')}
  ${opt('-h, --help')}            Show this help message
  ${opt('-v, --version')}         Show version
  ${opt('--no-color')}            Disable colored output

${title('Examples:')}
  git-hooks install pre-commit
  git-hooks install              # Install all configured hooks
  git-hooks uninstall pre-commit
  git-hooks list
  git-hooks run pre-commit
  git-hooks check                # Validate your configuration
`)
}

/**
 * Show version
 */
function showVersion(): void {
  console.log(`git-hooks-cli v${PACKAGE_VERSION}`)
}

/**
 * Generate hook script content
 */
function generateHookScript(hookName: string, command: string): string {
  const isWindows = process.platform === 'win32'
  
  if (isWindows) {
    // Windows batch file - use node directly to avoid npx delay
    return `@echo off
REM git-hooks-cli generated hook: ${hookName}
REM DO NOT EDIT MANUALLY

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "ROOT_DIR=%%~fI"
node "%ROOT_DIR%\\node_modules\\.bin\\git-hooks" run "${hookName}" %*
if %errorlevel% neq 0 exit /b %errorlevel%
`
  } else {
    // Unix shell script - use node_modules/.bin for direct execution
    return `#!/bin/sh
# git-hooks-cli generated hook: ${hookName}
# DO NOT EDIT MANUALLY

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# Resolve to absolute path
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

exec "$ROOT_DIR/node_modules/.bin/git-hooks" run "${hookName}" "$@"
`
  }
}

/**
 * Install a hook
 */
function installHook(hookName?: string, silent = false): void {
  const useColors = supportsColor()
  const ok = (text: string) => useColors ? colorize(text, 'green') : text
  
  // Check for CI/silent mode from environment
  const isSilent = silent || process.env.CI || process.env.GIT_HOOKS_SILENT
  const gitDir = getGitDir()
  if (!gitDir) {
    if (isSilent) return // Silent mode: just skip if not in git repo
    console.error('Error: Not in a git repository (.git directory not found)')
    process.exit(1)
  }

  const hooksDir = join(gitDir, 'hooks')
  if (!existsSync(hooksDir)) {
    mkdirSync(hooksDir, { recursive: true })
  }

  const config = getConfiguredHooks()
  const hookNames = hookName ? [hookName] : Object.keys(config)

  if (hookNames.length === 0) {
    console.log('No hooks configured. Add hooks to package.json["git-hooks"] or .git-hookrc')
    return
  }

  const isWindows = process.platform === 'win32'
  const pkg = getPackageJson()

  for (const name of hookNames) {
    const hookConfig = config[name]
    if (!hookConfig) {
      console.warn(`Warning: Hook "${name}" not found in configuration`)
      continue
    }

    // Handle different config formats
    let command: string
    if (Array.isArray(hookConfig)) {
      // Array format: ["npm run lint", "npm run test"]
      command = hookConfig.join(' && ')
    } else if (typeof hookConfig === 'object' && hookConfig !== null) {
      // Object format with run, parallel, etc.
      const configObj = hookConfig as Record<string, unknown>
      const runConfig = configObj.run
      if (Array.isArray(runConfig)) {
        // Simple run array: ["lint", "test"]
        const scripts = runConfig.map((s: string) => resolveScript(s, pkg || {}))
        command = scripts.join(' && ')
      } else if (typeof runConfig === 'string') {
        command = runConfig
      } else {
        command = 'npm test' // Fallback
      }
    } else {
      command = String(hookConfig)
    }

    // Add .cmd extension on Windows
    const hookFileName = isWindows ? `${name}.cmd` : name
    const hookPath = join(hooksDir, hookFileName)

    writeFileSync(hookPath, generateHookScript(name, command), isWindows ? undefined : { mode: 0o755 })
    console.log(`${ok('✓')} Installed: ${hookPath}`)
  }

  console.log('\nHooks installed successfully!')
}

/**
 * Uninstall a hook
 */
function uninstallHook(hookName?: string): void {
  const useColors = supportsColor()
  const ok = (text: string) => useColors ? colorize(text, 'green') : text
  
  const gitDir = getGitDir()
  if (!gitDir) {
    console.error('Error: Not in a git repository (.git directory not found)')
    process.exit(1)
  }

  const hooksDir = join(gitDir, 'hooks')

  if (!existsSync(hooksDir)) {
    console.log('No hooks directory found')
    return
  }

  const config = getConfiguredHooks()
  const isWindows = process.platform === 'win32'

  // Helper to get hook file path (with .cmd extension on Windows)
  const getHookPath = (name: string) => join(hooksDir, isWindows ? `${name}.cmd` : name)

  if (hookName) {
    const hookPath = getHookPath(hookName)
    if (existsSync(hookPath)) {
      rmSync(hookPath)
      console.log(`${ok('✓')} Uninstalled: ${hookPath}`)
    } else {
      console.warn(`Hook "${hookName}" not found`)
    }
  } else {
    // Uninstall all hooks that match our config
    let removed = 0
    for (const name of Object.keys(config)) {
      const hookPath = getHookPath(name)
      if (existsSync(hookPath)) {
        rmSync(hookPath)
        removed++
      }
    }
    console.log(`${ok('✓')} Uninstalled ${removed} hook(s)`)
  }
}

/**
 * List configured hooks
 */
function listHooks(): void {
  const useColors = supportsColor()
  const installed = (text: string) => useColors ? colorize(text, 'green') : text
  const notInstalled = (text: string) => useColors ? colorize(text, 'gray') : text
  
  const config = getConfiguredHooks()
  const gitDir = getGitDir()
  const isWindows = process.platform === 'win32'

  console.log('Configured hooks:')
  console.log('')

  if (Object.keys(config).length === 0) {
    console.log('  No hooks configured')
    console.log('')
    console.log('Add hooks to package.json["git-hooks"] or .git-hookrc')
    return
  }

  // Helper to get hook file path (with .cmd extension on Windows)
  const getHookPath = (name: string) => join(gitDir || '', 'hooks', isWindows ? `${name}.cmd` : name)

  for (const [name, hookConfig] of Object.entries(config)) {
    let commandStr: string
    if (Array.isArray(hookConfig)) {
      commandStr = hookConfig.join(' && ')
    } else if (typeof hookConfig === 'object' && hookConfig !== null) {
      const configObj = hookConfig as Record<string, unknown>
      const runConfig = configObj.run
      if (Array.isArray(runConfig)) {
        commandStr = runConfig.join(' && ')
      } else if (typeof runConfig === 'string') {
        commandStr = runConfig
      } else {
        commandStr = JSON.stringify(hookConfig)
      }
    } else {
      commandStr = String(hookConfig)
    }
    
    let status = ''
    if (gitDir) {
      const hookPath = getHookPath(name)
      status = existsSync(hookPath) ? ` ${installed('[installed]')}` : ` ${notInstalled('[not installed]')}`
    }
    console.log(`  ${name}: ${commandStr}${status}`)
  }
}

/**
 * Check hook status
 */
function checkStatus(): void {
  const useColors = supportsColor()
  const ok = (text: string) => useColors ? colorize(text, 'green') : text
  const warn = (text: string) => useColors ? colorize(text, 'yellow') : text
  const fail = (text: string) => useColors ? colorize(text, 'red') : text
  const dim = (text: string) => useColors ? colorize(text, 'gray') : text
  
  const config = getConfiguredHooks()
  const gitDir = getGitDir()
  const isWindows = process.platform === 'win32'

  console.log('Hook status:')
  console.log('')

  if (!gitDir) {
    console.log(`  ${warn('Not in a git repository')}`)
    return
  }

  const hooksDir = join(gitDir, 'hooks')

  if (!existsSync(hooksDir)) {
    console.log(`  ${warn('.git/hooks directory does not exist')}`)
    return
  }

  // Get hook files (no extension on Unix, .cmd on Windows)
  const getHookFileName = (name: string) => isWindows ? `${name}.cmd` : name

  const installedHooks = existsSync(hooksDir) ? readdirSync(hooksDir)
    .filter(f => !f.endsWith('.sample'))
    .filter(f => {
      if (isWindows) {
        return f.endsWith('.cmd')
      } else {
        return !f.includes('.')
      }
    })
    .map(f => isWindows ? f.replace(/\.cmd$/, '') : f) : []

  if (installedHooks.length === 0 && Object.keys(config).length === 0) {
    console.log(`  ${dim('No hooks installed or configured')}`)
    return
  }

  // Show installed hooks
  console.log(`${ok('Installed hooks:')} ${installedHooks.length}`)
  for (const hook of installedHooks) {
    console.log(`  ${ok('[✓]')} ${hook}`)
  }

  // Show configured but not installed
  const configuredNotInstalled = Object.keys(config).filter(h => !installedHooks.includes(h))
  if (configuredNotInstalled.length > 0) {
    console.log(`\n${warn('Configured but not installed:')} ${configuredNotInstalled.length}`)
    for (const hook of configuredNotInstalled) {
      console.log(`  ${warn('[ ]')} ${hook}`)
    }
  }

  // Show installed but not configured
  const installedNotConfigured = installedHooks.filter(h => !Object.keys(config).includes(h))
  if (installedNotConfigured.length > 0) {
    console.log(`\n${warn('Installed but not configured:')} ${installedNotConfigured.length}`)
    for (const hook of installedNotConfigured) {
      console.log(`  ${warn('[?]')} ${hook}`)
    }
  }

  // Summary
  console.log('')
  const allGood = configuredNotInstalled.length === 0 && installedNotConfigured.length === 0
  if (allGood && installedHooks.length > 0) {
    console.log(`${ok('✓')} All configured hooks are installed and ready!`)
  } else if (installedHooks.length === 0) {
    console.log(`${warn('→')} Run ${dim('git-hooks install')} to install your configured hooks`)
  }
}

/**
 * Validate configuration
 */
function checkConfig(): void {
  const useColors = supportsColor()
  const ok = (text: string) => useColors ? colorize(text, 'green') : text
  const warn = (text: string) => useColors ? colorize(text, 'yellow') : text
  const fail = (text: string) => useColors ? colorize(text, 'red') : text
  const title = (text: string) => useColors ? colorize(text, 'cyan') : text
  const dim = (text: string) => useColors ? colorize(text, 'gray') : text

  console.log('')
  console.log(`${title('═').repeat(40)}`)
  console.log(`${title(' git-hooks-cli Configuration Check ')}${title('═').repeat(40 - 30)}`)
  console.log('')

  const pkg = getPackageJson()
  const config = getConfiguredHooks()
  const gitDir = getGitDir()

  // Check git repository
  console.log(`${title('Git Repository:')}`)
  if (gitDir) {
    console.log(`  ${ok('✓')} Valid git repository found`)
  } else {
    console.log(`  ${fail('✗')} Not in a git repository`)
    console.log(`    ${dim('Run: git init')}`)
    return
  }

  // Check configuration
  console.log(`\n${title('Configuration:')}`)
  if (Object.keys(config).length === 0) {
    console.log(`  ${fail('✗')} No hooks configured`)
    console.log(`    ${dim('Add to package.json:')}`)
    console.log(`    { "git-hooks": { "pre-commit": "npm run lint" } }`)
    console.log(`    ${dim('Or create .git-hookrc:')}`)
    console.log(`    { "pre-commit": "npm run lint" }`)
  } else {
    console.log(`  ${ok('✓')} Configuration found`)
    console.log(`    ${dim(`Source: ${getConfigFromPackageJson() ? 'package.json' : '.git-hookrc'}`)}`)
    
    // Check for advanced features
    const hasParallel = Object.values(config).some(c => 
      typeof c === 'object' && c !== null && 'parallel' in c
    )
    const hasIgnore = Object.values(config).some(c =>
      typeof c === 'object' && c !== null && 'ignore' in c
    )
    
    if (hasParallel) {
      console.log(`  ${ok('✓')} Parallel execution configured`)
    }
    if (hasIgnore) {
      console.log(`  ${ok('✓')} Ignore patterns configured`)
    }
  }

  // Check hooks directory
  console.log(`\n${title('Hooks Directory:')}`)
  const hooksDir = join(gitDir, 'hooks')
  if (existsSync(hooksDir)) {
    console.log(`  ${ok('✓')} .git/hooks exists`)
    
    const isWindows = process.platform === 'win32'
    const installedCount = readdirSync(hooksDir)
      .filter(f => !f.endsWith('.sample'))
      .filter(f => isWindows ? f.endsWith('.cmd') : !f.includes('.'))
      .length
    
    console.log(`  ${ok('✓')} ${installedCount} hook(s) installed`)
  } else {
    console.log(`  ${warn('→')} .git/hooks does not exist yet`)
    console.log(`    ${dim('Run: git-hooks install')}`)
  }

  // Check scripts in package.json
  console.log(`\n${title('npm Scripts:')}`)
  if (pkg && pkg.scripts) {
    const scripts = pkg.scripts as Record<string, string>
    const relevantScripts = ['lint', 'test', 'build', 'typecheck', 'format']
    const found = relevantScripts.filter(s => Object.keys(scripts).includes(s))
    
    if (found.length > 0) {
      console.log(`  ${ok('✓')} Relevant scripts found: ${found.join(', ')}`)
    } else {
      console.log(`  ${warn('→')} No common scripts found (lint, test, build...)`)
    }
  } else {
    console.log(`  ${warn('→')} No scripts in package.json`)
  }

  console.log('')
  console.log(`${title('═').repeat(40)}`)
  
  // Summary
  if (Object.keys(config).length > 0 && gitDir) {
    console.log(`${ok('✓')} Configuration is valid!`)
    console.log(`${dim('Run: git-hooks install')}`)
  } else {
    console.log(`${warn('→')} Run: git-hooks install <hook-name>`)
  }
  console.log('')
}

/**
 * Run a hook manually
 */
async function runHook(hookName: string, args: string[]): Promise<void> {
  const useColors = supportsColor()
  const dim = (text: string) => useColors ? colorize(text, 'gray') : text
  
  const config = getConfiguredHooks()
  const hookConfig = config[hookName]

  if (!hookConfig) {
    console.error(`Error: Hook "${hookName}" not found in configuration`)
    process.exit(1)
  }

  // Handle different config formats
  let commands: string[]
  const pkg = getPackageJson()
  
  if (Array.isArray(hookConfig)) {
    commands = hookConfig
  } else if (typeof hookConfig === 'object' && hookConfig !== null) {
    const configObj = hookConfig as Record<string, unknown>
    const runConfig = configObj.run
    if (Array.isArray(runConfig)) {
      commands = runConfig.map((s: string) => resolveScript(s, pkg || {}))
    } else if (typeof runConfig === 'string') {
      commands = [runConfig]
    } else {
      commands = ['npm test'] // Fallback
    }
  } else {
    commands = [String(hookConfig)]
  }

  console.log(`Running hook: ${hookName}`)
  console.log(`Args: ${args.join(' ') || '(none)'}`)
  console.log('')

  // Check for parallel execution
  const hookConfigObj = typeof hookConfig === 'object' && hookConfig !== null ? hookConfig as Record<string, unknown> : null
  const isParallel = hookConfigObj?.parallel === true

  let success = true

  if (isParallel && commands.length > 1) {
    console.log(`${dim('(Running in parallel...)')}`)

    // Run commands in parallel
    const results = await Promise.all(
      commands.map(command =>
        new Promise<boolean>((resolve) => {
          console.log(`$ ${command}`)
          const isWin = process.platform === 'win32'
          const options: ExecOptions = {
            cwd: process.cwd(),
            env: { ...process.env },
            shell: isWin ? 'cmd.exe' : '/bin/sh'
          }
          exec(command, options, (error: Error | null) => {
            if (error) {
              console.error(`Command failed: ${command}`)
              resolve(false)
            } else {
              resolve(true)
            }
          })
        })
      )
    )
    success = results.every(r => r)
  } else {
    for (const command of commands) {
      try {
        console.log(`$ ${command}`)
        execSync(command, {
          stdio: 'inherit',
          cwd: process.cwd(),
          env: { ...process.env }
        })
      } catch {
        success = false
        console.error(`Command failed: ${command}`)
      }
    }
  }

  process.exit(success ? 0 : 1)
}

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2)
  
  // Check for --no-color flag
  const noColorIndex = args.indexOf('--no-color')
  if (noColorIndex !== -1) {
    args.splice(noColorIndex, 1)
  }
  
  const command = args[0]

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp()
    return
  }

  if (command === 'version' || command === '--version' || command === '-v') {
    showVersion()
    return
  }

  switch (command) {
    case 'install':
    case 'add':
    case 'enable':
      installHook(args[1])
      break
    case 'uninstall':
    case 'remove':
    case 'disable':
      uninstallHook(args[1])
      break
    case 'list':
    case 'ls':
      listHooks()
      break
    case 'status':
      checkStatus()
      break
    case 'check':
    case 'validate':
      checkConfig()
      break
    case 'run':
      if (!args[1]) {
        console.error('Error: Hook name required')
        console.error('Usage: git-hooks run <hook-name>')
        process.exit(1)
      }
      runHook(args[1], args.slice(2))
      break
    default:
      console.error('Unknown command: ' + command)
      showHelp()
      process.exit(1)
  }
}

main().catch((error) => {
  console.error('Error:', error.message)
  // In CI/silent mode, always exit with 0 to avoid install failures
  if (process.env.CI || process.env.GIT_HOOKS_SILENT) {
    process.exit(0)
  }
  process.exit(1)
})
