#!/usr/bin/env node
/**
 * setup/index.js — oh-my-colab interactive onboarding
 * 6 screens: platforms → team → workflow → MCP → notifications → HUD
 */

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { execSync } = require('child_process');
const { picker }      = require('../utils/interactive-picker');
const { maskedInput } = require('../utils/masked-input');
const { scan }        = require('../utils/project-scanner');

const CWD     = process.cwd();
const PKG_ROOT = path.join(__dirname, '../..');

const MCP_SERVERS = [
  { name: 'context7',     label: 'Context7      — live library docs (free; key optional)',  needsKey: 'optional', keyName: 'CONTEXT7_API_KEY',                command: 'npx', args: ['-y', '@upstash/context7-mcp'] },
  { name: 'github',       label: 'GitHub MCP    — repos, PRs, issues, CI',                  needsKey: true,       keyName: 'GITHUB_PERSONAL_ACCESS_TOKEN',      command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'] },
  { name: 'brave-search', label: 'Brave Search  — web search',                              needsKey: true,       keyName: 'BRAVE_API_KEY',                     command: 'npx', args: ['-y', '@anthropic/mcp-brave-search'] },
  { name: 'playwright',   label: 'Playwright    — browser automation, e2e testing',         needsKey: false,      command: 'npx', args: ['-y', '@anthropic/mcp-playwright'] },
  { name: 'firecrawl',    label: 'Firecrawl     — web scraping',                            needsKey: true,       keyName: 'FIRECRAWL_API_KEY',                 command: 'npx', args: ['-y', 'firecrawl-mcp'] },
  { name: 'linear',       label: 'Linear        — project management',                      needsKey: true,       keyName: 'LINEAR_API_KEY',                    command: 'npx', args: ['-y', '@linear/mcp-server'] },
  { name: 'sentry',       label: 'Sentry        — error monitoring',                        needsKey: true,       keyName: 'SENTRY_AUTH_TOKEN',                 command: 'npx', args: ['-y', '@sentry/mcp-server'] },
  { name: 'figma',        label: 'Figma         — design context',                          needsKey: true,       keyName: 'FIGMA_API_KEY',                     command: 'npx', args: ['-y', '@figma/mcp-server'] },
];

async function run() {
  const { stdout } = process;
  stdout.write('\x1B[2J\x1B[H');
  stdout.write('  🧠 oh-my-colab setup\n  ─────────────────────────────────────\n\n');

  const project = scan(CWD);

  // Screen 1: Platforms
  const platforms = await picker({
    title: 'oh-my-colab setup (1/6)',
    subtitle: 'Platforms (Space to toggle, Enter to confirm)',
    options: ['Claude Code', 'Cursor', 'Antigravity', 'Codex CLI', 'Gemini CLI', 'OpenCode'],
    multiSelect: true,
    defaults: ['Claude Code']
  }) || ['Claude Code'];

  // Screen 2: Team mode
  const [teamMode] = await picker({
    title: 'oh-my-colab setup (2/6)',
    subtitle: 'Team setup',
    options: ['Solo developer', 'Small team (2–10)', 'Large org (10+, Cursor Teams)'],
  }) || ['Solo developer'];

  // Screen 3: Workflow
  const [workflow] = await picker({
    title: 'oh-my-colab setup (3/6)',
    subtitle: 'Default workflow style',
    options: ['Autopilot (plan + build + review)', 'Plan-first', 'TDD-strict', 'Freestyle'],
  }) || ['Autopilot (plan + build + review)'];

  // Screen 4: MCP servers
  const mcpLabels = MCP_SERVERS.map(s => s.label);
  const selectedLabels = await picker({
    title: 'oh-my-colab setup (4/6)',
    subtitle: 'MCP servers (Space to toggle, Enter when done)',
    options: mcpLabels,
    multiSelect: true,
    defaults: [MCP_SERVERS[0].label, MCP_SERVERS[1].label, MCP_SERVERS[2].label]
  }) || [];

  const selectedMcp = MCP_SERVERS.filter(s => selectedLabels.includes(s.label));
  const mcpKeys = {};

  for (const srv of selectedMcp) {
    if (srv.needsKey === true) {
      const { value, skipped } = await maskedInput(
        `${srv.name} selected.`,
        `Enter your ${srv.keyName} (Ctrl+C to skip)`
      );
      if (!skipped && value) mcpKeys[srv.name] = { [srv.keyName]: value };
    } else if (srv.needsKey === 'optional') {
      const { value, skipped } = await maskedInput(
        `${srv.name}: free without key (60 req/hr). Optional: get free key at context7.com/dashboard`,
        `Enter API key or press Enter to skip`
      );
      if (!skipped && value) mcpKeys[srv.name] = { [srv.keyName]: value };
    }
  }

  // Screen 5: Notifications
  const [notifyChoice] = await picker({
    title: 'oh-my-colab setup (5/6)',
    subtitle: 'Session notifications',
    options: ['None', 'Slack (webhook URL)', 'Discord (webhook URL)', 'Telegram (bot token)'],
  }) || ['None'];

  let notifications = { provider: 'none' };
  if (notifyChoice !== 'None') {
    const provider = notifyChoice.split(' ')[0].toLowerCase();
    const { value } = await maskedInput(`${notifyChoice} selected.`, 'Enter webhook URL');
    if (value) notifications = { provider, webhookUrl: value };
  }

  // Screen 6: HUD
  const [hudStyle] = await picker({
    title: 'oh-my-colab setup (6/6)',
    subtitle: 'Status line style',
    options: ['Full (4 lines)', 'Standard (2 lines)', 'Minimal (1 line)', 'None'],
  }) || ['Full (4 lines)'];

  // Install
  stdout.write('\x1B[2J\x1B[H  🧠 oh-my-colab — Installing...\n  ─────────────────────────────────────\n\n');

  const config = { platforms, teamMode, workflow, selectedMcp, mcpKeys, notifications, hudStyle, project };

  const steps = [
    ['~/.ohc/ global dirs',           () => initGlobal()],
    ['.ohc/ project dirs',            () => initProject()],
    ['SOUL.md',                        () => genSoul()],
    ['USER.md',                        () => genUser(config)],
    ['PROJECT.md',                     () => genProject(config)],
    (platforms.includes('Claude Code') || platforms.includes('Codex CLI') || platforms.includes('OpenCode'))
                                       ? ['AGENTS.md / CLAUDE.md',          () => genAgents(config)] : null,
    platforms.includes('Claude Code')  ? ['~/.claude/settings.json',        () => genSettings(config)] : null,
    platforms.includes('Claude Code')  ? ['.claude/hooks/ + commands/',     () => writeClaudeFiles()] : null,
    platforms.includes('Cursor')       ? ['.cursor/rules/ + commands/', () => writeCursor(config)] : null,
    platforms.includes('Antigravity')  ? ['.agent/ rules/skills/workflows', () => writeAntigravity()] : null,
    platforms.includes('Gemini CLI')   ? ['GEMINI.md + gemini-extension.json', () => writeGemini(config)] : null,
    platforms.includes('Codex CLI')    ? ['.codex context file', () => writeCodex()] : null,
    platforms.includes('OpenCode')     ? ['.opencode/ dirs + config', () => writeOpenCode(config)] : null,
    platforms.includes('Claude Code')  ? ['MCP servers via claude mcp add', () => installMcp(config)] : null,
    hudStyle !== 'None'                ? ['HUD status bar',            () => writeHud(config)] : null,
    ['~/.ohc/config.json',             () => writeConfig(config)],
  ].filter(Boolean);

  for (const [label, fn] of steps) {
    try { fn(); stdout.write(`  ✓ ${label}\n`); }
    catch (e) { stdout.write(`  ✗ ${label} — ${e.message}\n`); }
  }

  stdout.write('\n  ✅ oh-my-colab installed!\n\n');
  stdout.write('  Next steps:\n');
  stdout.write('    1. Run /explore to understand this codebase\n');
  stdout.write('    2. Run /plan to start building something\n');
  stdout.write('    3. Type "autopilot" to let oh-my-colab drive\n\n');
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function mkdir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function tmpl(f)  { return fs.readFileSync(path.join(PKG_ROOT, 'templates', f), 'utf8'); }
function fill(t, vars) { return t.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] || `{{${k}}}`); }
function write(p, c, mode) { mkdir(path.dirname(p)); fs.writeFileSync(p, c, mode); }

function initGlobal() {
  ['skills','sessions','hud'].forEach(d => mkdir(path.join(os.homedir(), '.ohc', d)));
}

function initProject() {
  ['state/sessions','plans','skills','research','logs'].forEach(d =>
    mkdir(path.join(CWD, '.ohc', d))
  );
  const n = path.join(CWD, '.ohc', 'notepad.md');
  if (!fs.existsSync(n)) write(n, `# Working Notes\n\n## Current Task\n(none)\n\n## What's Done\n\n## Blockers\n(none)\n\n## Noticed (not in scope)\n\n## Next Steps\nRun /explore to understand this codebase.\n`);
  const m = path.join(CWD, '.ohc', 'project-memory.json');
  if (!fs.existsSync(m)) write(m, JSON.stringify({ tech_stack:{}, conventions:[], known_gotchas:[], learned:[] }, null, 2));
}

function genSoul() {
  const dest = path.join(os.homedir(), '.ohc', 'SOUL.md');
  if (!fs.existsSync(dest)) write(dest, tmpl('SOUL.template.md'));
}

function genUser({ project, workflow, notifications }) {
  const dest = path.join(os.homedir(), '.ohc', 'USER.md');
  if (!fs.existsSync(dest)) write(dest, fill(tmpl('USER.template.md'), {
    name: os.userInfo().username, role: 'Developer', experience: 'Intermediate',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    primary_languages: project.language, frameworks: project.framework,
    test_framework: project.testRunner, package_manager: project.packageManager,
    editor: 'VS Code / Cursor', default_workflow: workflow,
    commit_style: 'Conventional Commits', review_style: 'Thorough',
    notification_provider: notifications.provider,
    notification_destination: notifications.webhookUrl || 'none'
  }));
}

function genProject({ project }) {
  const dest = path.join(CWD, '.ohc', 'PROJECT.md');
  if (!fs.existsSync(dest)) write(dest, fill(tmpl('PROJECT.template.md'), {
    project_name: project.projectName,
    project_description: `${project.projectName} — a ${project.framework} application.`,
    language: project.language, framework: project.framework,
    test_runner: project.testRunner, package_manager: project.packageManager,
    ci_provider: project.ci, database: 'unknown',
    main_entry: project.mainEntry, test_directory: project.testDirectory,
    config_files: 'package.json, tsconfig.json', api_entry: 'src/api/',
    architecture_summary: 'Run /explore to generate architecture summary.',
    naming_convention: 'camelCase (functions/vars), PascalCase (classes)',
    file_structure_pattern: 'feature-based', import_style: 'ES modules',
    error_handling_pattern: 'throw Error, try/catch at boundaries',
    github_repo: project.gitRemote, linear_project: '', figma_file: ''
  }));
}

function genAgents({ project, selectedMcp, teamMode, platforms }) {
  const mcp = selectedMcp.map(s => `- ${s.name}`).join('\n') || '- (none)';
  const content = fill(tmpl('CLAUDE.template.md'), {
    version: '0.2.1', project_name: project.projectName,
    install_date: new Date().toISOString().split('T')[0],
    team_mode: teamMode.includes('Solo') ? 'solo' : 'team',
    max_parallel: teamMode.includes('Large') ? '8' : '4',
    mcp_servers_list: mcp
  });
  const needsClaude = platforms.includes('Claude Code');
  if (needsClaude) {
    write(path.join(CWD, 'CLAUDE.md'), content);
  }
  const agents = path.join(CWD, 'AGENTS.md');
  if (!fs.existsSync(agents)) {
    if (needsClaude) {
      try { fs.symlinkSync('CLAUDE.md', agents); }
      catch { write(agents, content); }
    } else {
      write(agents, content);
    }
  }
}

function genSettings({ teamMode, hudStyle }) {
  const p = path.join(os.homedir(), '.claude', 'settings.json');
  mkdir(path.dirname(p));
  let existing = {};
  try { existing = JSON.parse(fs.readFileSync(p, 'utf8')); } catch {}
  const hudPath = path.join(os.homedir(), '.ohc', 'hud', 'ohc-hud.sh');
  write(p, JSON.stringify({
    ...existing,
    env: { ...(existing.env||{}),
      CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1',
      OHC_TEAM_MODE: teamMode.includes('Solo') ? 'solo' : 'auto',
      OHC_MAX_PARALLEL: teamMode.includes('Large') ? '8' : '4'
    },
    ...(hudStyle !== 'None' ? { statusLine: hudPath, statusLineRefreshInterval: 2000 } : {})
  }, null, 2));
  write(path.join(CWD, '.claude', 'settings.json'),
    JSON.stringify({ permissions: { allow: ['Bash','Read','Write','Edit','MultiEdit'] } }, null, 2));
}

function writeClaudeFiles() {
  const hooksDir = path.join(CWD, '.claude', 'hooks');
  const cmdsDir  = path.join(CWD, '.claude', 'commands');
  mkdir(hooksDir); mkdir(cmdsDir);
  for (const h of ['on-session-start.js','on-pre-tool.js','on-post-tool.js','on-stop.js']) {
    const src = path.join(PKG_ROOT, 'hooks', h);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(hooksDir, h));
  }
  for (const f of fs.readdirSync(path.join(PKG_ROOT, 'commands'))) {
    fs.copyFileSync(path.join(PKG_ROOT, 'commands', f), path.join(cmdsDir, f));
  }
}

function writeCursor() {
  const rulesDir = path.join(CWD, '.cursor', 'rules');
  const cmdsDir  = path.join(CWD, '.cursor', 'commands');
  mkdir(rulesDir); mkdir(cmdsDir);
  for (const name of ['ohc-core','ohc-memory','ohc-discipline']) {
    const src = path.join(PKG_ROOT, 'templates', 'cursor-rules', `${name}.template.mdc`);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(rulesDir, `${name}.mdc`));
  }
  write(path.join(rulesDir, 'ohc-tdd.mdc'),
    `---\ndescription: TDD enforcement for test files\nglobs: ["**/*.test.ts","**/*.test.js","**/*.spec.ts","**/test_*.py"]\n---\n# TDD Rule\nWrite failing test first. Confirm it fails. Then write minimum implementation.\n`);
  for (const f of fs.readdirSync(path.join(PKG_ROOT, 'commands')))
    fs.copyFileSync(path.join(PKG_ROOT, 'commands', f), path.join(cmdsDir, f));
}

function writeAntigravity() {
  const rulesDir     = path.join(CWD, '.agent', 'rules');
  const skillsDir    = path.join(CWD, '.agent', 'skills');
  const workflowsDir = path.join(CWD, '.agent', 'workflows');
  mkdir(rulesDir); mkdir(skillsDir); mkdir(workflowsDir);
  for (const name of ['ohc-core','ohc-discipline','ohc-memory']) {
    const src = path.join(PKG_ROOT, 'templates', 'antigravity', `${name}.md`);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(rulesDir, `${name}.md`));
  }
  for (const skill of fs.readdirSync(path.join(PKG_ROOT, 'skills'))) {
    const src = path.join(PKG_ROOT, 'skills', skill, 'SKILL.md');
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(skillsDir, `${skill}.md`));
  }
  for (const cmd of ['plan','build','review','ship','retro']) {
    const src = path.join(PKG_ROOT, 'commands', `${cmd}.md`);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(workflowsDir, `${cmd}.md`));
  }
  // Also ensure global Antigravity dirs exist
  const global = path.join(os.homedir(), '.gemini', 'antigravity');
  mkdir(path.join(global, 'skills'));
  mkdir(path.join(global, 'global_workflows'));
}

function writeGemini({ project, selectedMcp, mcpKeys }) {
  write(path.join(CWD, 'GEMINI.md'), fill(tmpl('GEMINI.template.md'), { project_name: project.projectName }));
  
  const mcpServers = {};
  for (const srv of selectedMcp) {
    let env = {};
    const keys = mcpKeys[srv.name];
    if (keys) {
      for (const [k, v] of Object.entries(keys)) env[k] = v;
    }
    const args = [...srv.args];
    if (srv.name === 'context7' && keys?.CONTEXT7_API_KEY) {
      args.push('--api-key', keys.CONTEXT7_API_KEY);
    }
    mcpServers[srv.name] = { command: srv.command, args, env };
  }
  
  write(path.join(CWD, 'gemini-extension.json'), JSON.stringify({
    name: project.projectName,
    version: "0.2.1",
    description: `Gemini Code Assist extension for ${project.projectName}`,
    mcpServers
  }, null, 2));
}

function writeOpenCode({ selectedMcp, mcpKeys }) {
  ['agents', 'commands', 'skills', 'tools'].forEach(d => 
    mkdir(path.join(CWD, '.opencode', d))
  );
  
  const mcpServers = {};
  for (const srv of selectedMcp) {
    let env = {};
    const keys = mcpKeys[srv.name];
    if (keys) {
      for (const [k, v] of Object.entries(keys)) env[k] = v;
    }
    const args = [...srv.args];
    if (srv.name === 'context7' && keys?.CONTEXT7_API_KEY) {
      args.push('--api-key', keys.CONTEXT7_API_KEY);
    }
    mcpServers[srv.name] = { command: srv.command, args, env };
  }

  write(path.join(CWD, 'opencode.json'), JSON.stringify({
    telemetry: false,
    theme: 'default',
    mcpServers
  }, null, 2));
}

function writeCodex() {
  const content = `# oh-my-colab context for Codex CLI

You are operating with the oh-my-colab framework — a team-first AI coding workflow system.

## Identity
Read AGENTS.md for your full system context, agent catalog, and workflow definitions.
Read .ohc/notepad.md at the start of every session to restore working state.

## Core Rules
1. Never write code for tasks >30 minutes without a plan in .ohc/plans/
2. Always run tests before claiming a task complete
3. Update .ohc/notepad.md when finishing work (for team handoff)
4. Follow ohc-coding-discipline: minimal scope, surgical changes, explicit assumptions
5. Use Context7 for any external library documentation before writing API calls

## Workflows
- "explore" → explore codebase, populate .ohc/PROJECT.md
- "plan"    → write plan to .ohc/plans/, confirm before building
- "build"   → load plan, dispatch subagents, enforce TDD
- "review"  → two-pass: spec compliance then code quality
- "ship"    → verify tests, write changelog, clean branch
- "retro"   → session retrospective, extract learnings

## Bootstrap
If fresh install: fetch and follow .codex-bootstrap/INSTALL.md
`;
  write(path.join(CWD, '.codex'), content);
}

function installMcp({ selectedMcp, mcpKeys }) {
  for (const srv of selectedMcp) {
    try {
      let cmd = `claude mcp add --scope user ${srv.name}`;
      const keys = mcpKeys[srv.name];
      if (keys) {
        for (const [k, v] of Object.entries(keys)) cmd += ` -e ${k}=${v}`;
      }
      // Context7 with optional key
      if (srv.name === 'context7' && keys?.CONTEXT7_API_KEY) {
        cmd += ` -- ${srv.command} ${srv.args.join(' ')} --api-key ${keys.CONTEXT7_API_KEY}`;
      } else {
        cmd += ` -- ${srv.command} ${srv.args.join(' ')}`;
      }
      execSync(cmd, { stdio: 'pipe' });
    } catch (e) {
      // Non-fatal — print manual command
      console.log(`  ⚠ MCP ${srv.name}: run manually: claude mcp add ${srv.name} -- ${srv.command} ${srv.args.join(' ')}`);
    }
  }
}

function writeHud({ hudStyle }) {
  const dir = path.join(os.homedir(), '.ohc', 'hud');
  mkdir(dir);
  const src = path.join(PKG_ROOT, 'scripts', 'hud', 'ohc-hud.sh');
  const dst = path.join(dir, 'ohc-hud.sh');
  if (fs.existsSync(src)) {
    const map = { 'Full (4 lines)': 'full', 'Standard (2 lines)': 'standard', 'Minimal (1 line)': 'minimal' };
    let c = fs.readFileSync(src, 'utf8');
    c = c.replace(/^OHC_HUD_STYLE=.*/m, `OHC_HUD_STYLE="${map[hudStyle] || 'full'}"`);
    write(dst, c, { mode: 0o755 });
  }
}

function writeConfig({ platforms, teamMode, workflow, notifications, hudStyle }) {
  write(path.join(os.homedir(), '.ohc', 'config.json'), JSON.stringify({
    version: '0.2.1', platforms, teamMode,
    defaultWorkflow: workflow, notifications, hudStyle,
    installedAt: new Date().toISOString()
  }, null, 2));
}

run().catch(e => { process.stderr.write(`Setup error: ${e.message}\n`); process.exit(1); });
