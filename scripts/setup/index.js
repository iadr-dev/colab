#!/usr/bin/env node
/**
 * setup/index.js — oh-my-colab interactive onboarding
 * 5 screens: platforms → team → workflow → MCP → HUD
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
  { name: 'brave-search', label: 'Brave Search  — web search',                              needsKey: true,       keyName: 'BRAVE_API_KEY',                     command: 'npx', args: ['-y', '@modelcontextprotocol/server-brave-search'] },
  { name: 'playwright',   label: 'Playwright    — browser automation, e2e testing',         needsKey: false,      command: 'npx', args: ['-y', '@playwright/mcp'] },
  { name: 'firecrawl',    label: 'Firecrawl     — web scraping',                            needsKey: true,       keyName: 'FIRECRAWL_API_KEY',                 command: 'npx', args: ['-y', 'firecrawl-mcp'] },
  { name: 'linear',       label: 'Linear        — project management',                      needsKey: false,      command: 'npx', args: ['-y', 'mcp-remote', 'https://mcp.linear.app/mcp'] },
  { name: 'sentry',       label: 'Sentry        — error monitoring',                        needsKey: true,       keyName: 'SENTRY_AUTH',                     url: 'https://mcp.sentry.dev/mcp' },
  { name: 'figma',        label: 'Figma         — design context',                          needsKey: false,      url: 'https://mcp.figma.com/sse' },
];

async function run() {
  const { stdout } = process;
  stdout.write('\x1B[2J\x1B[H');
  stdout.write('  🧠 oh-my-colab setup\n  ─────────────────────────────────────\n\n');

  const project = scan(CWD);

  // Screen 1: Platforms
  const platforms = await picker({
    title: 'oh-my-colab setup (1/5)',
    subtitle: 'Platforms (Space to toggle, Enter to confirm)',
    options: ['Claude Code', 'Cursor', 'Antigravity', 'Codex CLI', 'Gemini CLI'],
    multiSelect: true,
    defaults: ['Claude Code']
  }) || ['Claude Code'];

  // Screen 2: Team mode
  const [teamMode] = await picker({
    title: 'oh-my-colab setup (2/5)',
    subtitle: 'Team setup',
    options: ['Solo developer', 'Small team (2–10)', 'Large org (10+, Cursor Teams)'],
  }) || ['Solo developer'];

  // Screen 3: Workflow
  const [workflow] = await picker({
    title: 'oh-my-colab setup (3/5)',
    subtitle: 'Default workflow style',
    options: ['Autopilot (plan + build + review)', 'Plan-first', 'TDD-strict', 'Freestyle'],
  }) || ['Autopilot (plan + build + review)'];

  // Screen 4: MCP servers — detection is per selected platform; "(detected)" meant
  // "somewhere" which misled multi-platform runs. Labels show on which platforms
  // each server already exists and which still need onboarding.
  const mcpPresence = detectMcpPresenceByPlatform(platforms);
  const mcpLabels = MCP_SERVERS.map(s => mcpPickerLabel(s, platforms, mcpPresence));

  const selectedLabels = await picker({
    title: 'oh-my-colab setup (4/5)',
    subtitle: platforms.length > 1
      ? 'MCP (labels show which selected platforms already have each server)'
      : 'MCP servers (Space to toggle, Enter when done)',
    options: mcpLabels,
    multiSelect: true,
    defaults: MCP_SERVERS
      .filter(s => mcpNeedsOnboardingOnSomePlatform(s.name, platforms, mcpPresence))
      .slice(0, 3)
      .map(s => mcpLabels[MCP_SERVERS.indexOf(s)])
  }) || [];

  const selectedMcp = MCP_SERVERS.filter((s, idx) => selectedLabels.includes(mcpLabels[idx]));
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

  // Screen 5: HUD — only prompt when Claude Code is selected (only platform whose
  // statusLine picks it up). On other platforms, still install the script so it
  // can be used in tmux/prompt, but default to 'full' style without asking.
  let hudStyle;
  if (platforms.includes('Claude Code')) {
    [hudStyle] = await picker({
      title: 'oh-my-colab setup (5/5)',
      subtitle: 'Status line style (Claude Code)',
      options: ['Full (3 lines)', 'Standard (2 lines)', 'Minimal (1 line)', 'None'],
    }) || ['Full (3 lines)'];
  } else {
    hudStyle = 'Full (3 lines)';
  }

  const contextSeedChoices = contextSeedChoiceRows(CWD);
  const contextLabels = contextSeedChoices.map(c => c.label);
  const [pickedContextLabel] = await picker({
    title: 'oh-my-colab setup — optional glossary',
    subtitle: 'CONTEXT templates — bracket text reflects files already in the project root',
    options: contextLabels,
  }) || [contextLabels[0]];
  const _ctxPickIdx = contextLabels.indexOf(pickedContextLabel);
  const seedDomainTemplates =
    _ctxPickIdx >= 0 ? contextSeedChoices[_ctxPickIdx].value : 'Skip';

  // Install
  stdout.write('\x1B[2J\x1B[H  🧠 oh-my-colab — Installing...\n  ─────────────────────────────────────\n\n');

  const config = { platforms, teamMode, workflow, selectedMcp, mcpKeys, hudStyle, project, seedDomainTemplates };

  const steps = [
    ['~/.ohc/ global dirs',           () => initGlobal()],
    ['.ohc/ project dirs',            () => initProject()],
    ['SOUL.md',                        () => genSoul()],
    ['USER.md',                        () => genUser(config)],
    ['PROJECT.md',                     () => genProject(config)],
    ['CONTEXT templates',              () => genContextSeed(config)],
    (platforms.includes('Claude Code') || platforms.includes('Codex CLI') || platforms.includes('Cursor'))
                                       ? ['AGENTS.md / CLAUDE.md',          () => genAgents(config)] : null,
    platforms.includes('Claude Code')  ? ['~/.claude/settings.json',        () => genSettings(config)] : null,
    platforms.includes('Claude Code')  ? ['.claude/ hooks+commands+agents+skills+scripts', () => writeClaudeFiles()] : null,
    platforms.includes('Cursor')       ? ['.cursor/rules+mcp (+ .claude/ compat)', () => writeCursor(config)] : null,
    platforms.includes('Antigravity')  ? ['.agents/ + scripts + global mcp_config.json', () => writeAntigravity(config)] : null,
    platforms.includes('Gemini CLI')   ? ['GEMINI.md + ~/.gemini/settings.json', () => writeGemini(config)] : null,
    platforms.includes('Codex CLI')    ? ['~/.codex/ + .agents/skills + config.toml', () => writeCodex(config)] : null,
    platforms.includes('Claude Code')  ? ['MCP servers via claude mcp add', () => installMcp(config)] : null,
    hudStyle !== 'None'                ? ['HUD status bar',            () => writeHud(config)] : null,
    ['~/.ohc/config.json',             () => writeConfig(config)],
  ].filter(Boolean);

  for (const [label, fn] of steps) {
    try { fn(); stdout.write(`  ✓ ${label}\n`); }
    catch (e) { stdout.write(`  ✗ ${label} — ${e.message}\n`); }
  }

  console.log('\n  ✅ oh-my-colab installed!\n');

  if (platforms.includes('Cursor')) {
    const cursorNative = selectedMcp.filter(s => ['context7', 'figma', 'sentry'].includes(s.name));
    if (cursorNative.length > 0) {
      console.log('  💡 Cursor Tip:');
      console.log(`     You selected ${cursorNative.map(s => s.name).join(', ')}.`);
      console.log('     Please install these via: https://cursor.com/dashboard/plugins');
      console.log('     They are excluded from .cursor/mcp.json for stability.\n');
    }
  }

  console.log('  Next steps:');
  stdout.write('    1. Run /ohc-explore to understand this codebase\n');
  stdout.write('    2. Run /ohc-plan to start building something\n');
  stdout.write('    3. Type "autopilot" to let oh-my-colab drive\n\n');

  await promptStar(config);
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function mkdir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function tmpl(f)  { return fs.readFileSync(path.join(PKG_ROOT, 'templates', f), 'utf8'); }
function fill(t, vars) { return t.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] || `{{${k}}}`); }
function write(p, c, mode) { mkdir(path.dirname(p)); fs.writeFileSync(p, c, mode); }

/** Single-select glossary step: stable `value` for genContextSeed; `label` shows on-disk truth. */
function contextSeedChoiceRows(cwd) {
  const ctxPath = path.join(cwd, 'CONTEXT.md');
  const mapPath = path.join(cwd, 'CONTEXT-MAP.md');
  const ctxExists = fs.existsSync(ctxPath);
  const mapExists = fs.existsSync(mapPath);

  const only = ctxExists
    ? 'CONTEXT.md only [CONTEXT.md exists — skipped]'
    : 'CONTEXT.md only';

  let both = 'CONTEXT.md + CONTEXT-MAP.md';
  if (ctxExists && mapExists) both += ' [both exist — skipped]';
  else if (ctxExists) both += ' [CONTEXT.md exists — only CONTEXT-MAP filled if missing]';
  else if (mapExists) both += ' [CONTEXT-MAP.md exists — only CONTEXT filled if missing]';

  return [
    { value: 'Skip', label: 'Skip' },
    { value: 'CONTEXT.md only', label: only },
    { value: 'CONTEXT.md + CONTEXT-MAP.md', label: both },
  ];
}

function canonicalMcpKeys(mcpServersObj) {
  const found = new Set();
  if (!mcpServersObj || typeof mcpServersObj !== 'object') return found;
  for (const k of Object.keys(mcpServersObj)) {
    const low = k.toLowerCase();
    const match = MCP_SERVERS.find(s => s.name === k || s.name === low);
    if (match) found.add(match.name);
  }
  return found;
}

/** MCP server `name`s found for a single platform's config (Claude list, Cursor file, etc.). */
function getMcpServersForPlatform(platform) {
  const found = new Set();
  switch (platform) {
    case 'Claude Code':
      try {
        const list = execSync('claude mcp list', { stdio: 'pipe', encoding: 'utf8' });
        if (!list.includes('No MCP servers configured')) {
          MCP_SERVERS.forEach(s => {
            if (list.toLowerCase().includes(s.name.toLowerCase())) found.add(s.name);
          });
        }
      } catch { /* claude not installed or no list */ }
      break;
    case 'Cursor': {
      const mcpPath = path.join(CWD, '.cursor', 'mcp.json');
      if (fs.existsSync(mcpPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
          for (const n of canonicalMcpKeys(config.mcpServers)) found.add(n);
        } catch {}
      }
      break;
    }
    case 'Antigravity': {
      const mcpPath = path.join(os.homedir(), '.gemini', 'antigravity', 'mcp_config.json');
      if (fs.existsSync(mcpPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
          for (const n of canonicalMcpKeys(config.mcpServers)) found.add(n);
        } catch {}
      }
      break;
    }
    case 'Gemini CLI': {
      const settingsPath = path.join(os.homedir(), '.gemini', 'settings.json');
      if (fs.existsSync(settingsPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
          for (const n of canonicalMcpKeys(config.mcpServers)) found.add(n);
        } catch {}
      }
      break;
    }
    case 'Codex CLI': {
      const configPath = path.join(os.homedir(), '.codex', 'config.toml');
      if (fs.existsSync(configPath)) {
        try {
          const content = fs.readFileSync(configPath, 'utf8');
          MCP_SERVERS.forEach(s => {
            if (content.includes(`[mcp_servers.${s.name}]`)) found.add(s.name);
          });
        } catch {}
      }
      break;
    }
    default:
      break;
  }
  return found;
}

/** @returns { Record<string, string[]> } serverName -> platform labels (sorted) where that server is configured */
function detectMcpPresenceByPlatform(platforms) {
  /** @type Record<string, string[]> */
  const presence = {};
  for (const p of platforms) {
    for (const name of getMcpServersForPlatform(p)) {
      if (!presence[name]) presence[name] = [];
      presence[name].push(p);
    }
  }
  for (const k of Object.keys(presence)) {
    presence[k].sort((a, b) => platforms.indexOf(a) - platforms.indexOf(b));
  }
  return presence;
}

function shortPlatformLabel(p) {
  const map = { 'Claude Code': 'Claude', 'Codex CLI': 'Codex', 'Gemini CLI': 'Gemini' };
  return map[p] || p;
}

function mcpPickerLabel(srv, platforms, presence) {
  const on = presence[srv.name] || [];
  const base = srv.label;
  if (on.length === 0) return base;
  if (platforms.length === 1)
    return `${base} [already on ${platforms[0]}]`;
  const missing = platforms.filter(p => !on.includes(p));
  if (missing.length === 0)
    return `${base} [all selected platforms]`;
  return `${base} [on ${on.map(shortPlatformLabel).join(', ')}; add ${missing.map(shortPlatformLabel).join(', ')}]`;
}

function mcpNeedsOnboardingOnSomePlatform(serverName, platforms, presence) {
  const on = presence[serverName] || [];
  return on.length < platforms.length;
}

function configuredMcpServersOnClaude() {
  return getMcpServersForPlatform('Claude Code');
}

function initGlobal() {
  ['skills','sessions','hud'].forEach(d => mkdir(path.join(os.homedir(), '.ohc', d)));
}

function initProject() {
  ['state/sessions','plans','skills','research','logs'].forEach(d =>
    mkdir(path.join(CWD, '.ohc', d))
  );
  const n = path.join(CWD, '.ohc', 'notepad.md');
  if (!fs.existsSync(n)) write(n, `# Working Notes\n\n## Current Task\n(none)\n\n## What's Done\n\n## Blockers\n(none)\n\n## Noticed (not in scope)\n\n## Next Steps\nRun /ohc-explore to understand this codebase.\n`);
  const m = path.join(CWD, '.ohc', 'project-memory.json');
  if (!fs.existsSync(m)) write(m, JSON.stringify({ tech_stack:{}, conventions:[], known_gotchas:[], learned:[] }, null, 2));
}

function genSoul() {
  const dest = path.join(os.homedir(), '.ohc', 'SOUL.md');
  if (!fs.existsSync(dest)) write(dest, tmpl('SOUL.template.md'));
}

function genUser({ project, workflow }) {
  const dest = path.join(os.homedir(), '.ohc', 'USER.md');
  if (!fs.existsSync(dest)) write(dest, fill(tmpl('USER.template.md'), {
    name: os.userInfo().username, role: 'Developer', experience: 'Intermediate',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    primary_languages: project.language, frameworks: project.framework,
    test_framework: project.testRunner, package_manager: project.packageManager,
    editor: 'VS Code / Cursor', default_workflow: workflow,
    commit_style: 'Conventional Commits', review_style: 'Thorough'
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
    architecture_summary: 'Run /ohc-explore to generate architecture summary.',
    naming_convention: 'camelCase (functions/vars), PascalCase (classes)',
    file_structure_pattern: 'feature-based', import_style: 'ES modules',
    error_handling_pattern: 'throw Error, try/catch at boundaries',
    github_repo: project.gitRemote, linear_project: '', figma_file: ''
  }));
}

function genContextSeed({ seedDomainTemplates }) {
  const choice = seedDomainTemplates || 'Skip';
  if (choice === 'Skip') return;
  const ctx = path.join(CWD, 'CONTEXT.md');
  const mapPath = path.join(CWD, 'CONTEXT-MAP.md');
  if (choice === 'CONTEXT.md only' || choice === 'CONTEXT.md + CONTEXT-MAP.md') {
    if (!fs.existsSync(ctx)) write(ctx, tmpl('CONTEXT.template.md'));
  }
  if (choice === 'CONTEXT.md + CONTEXT-MAP.md') {
    if (!fs.existsSync(mapPath)) write(mapPath, tmpl('CONTEXT-MAP.template.md'));
  }
}

function genAgents({ project, selectedMcp, teamMode, platforms }) {
  const mcp = selectedMcp.map(s => `- ${s.name}`).join('\n') || '- (none)';
  const content = fill(tmpl('CLAUDE.template.md'), {
    version: '0.4.8', project_name: project.projectName,
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
    ...(hudStyle !== 'None' ? {
      statusLine: {
        type: 'command',
        command: hudPath,
        refreshInterval: 2
      }
    } : {})
  }, null, 2));

  // Project-scoped permissions for seamless workflow
  const mcpAllow = MCP_SERVERS.map(s => `mcp__${s.name}`);
  const allow = [
    'Bash', 'Read', 'Write', 'Edit', 'MultiEdit', 'WebFetch',
    'Grep', 'Glob', // Built-in search tools
    'Agent(Explore)', 'Agent(Plan)',
    ...mcpAllow
  ];

  write(path.join(CWD, '.claude', 'settings.json'),
    JSON.stringify({ permissions: { allow } }, null, 2));
}

function copyDir(src, dst) {
  mkdir(dst);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else if (entry.isFile()) fs.copyFileSync(s, d);
  }
}

function writeClaudeFiles() {
  const hooksDir  = path.join(CWD, '.claude', 'hooks');
  const cmdsDir   = path.join(CWD, '.claude', 'commands');
  const agentsDir = path.join(CWD, '.claude', 'agents');
  const skillsDir = path.join(CWD, '.claude', 'skills');
  mkdir(hooksDir); mkdir(cmdsDir); mkdir(agentsDir); mkdir(skillsDir);

  // Deploy hooks.json (Anthropic verbose format — single registration source)
  const hooksSrc = path.join(PKG_ROOT, 'hooks', 'hooks.json');
  if (fs.existsSync(hooksSrc)) fs.copyFileSync(hooksSrc, path.join(CWD, '.claude', 'hooks.json'));

  // Copy all hook JS files
  const allHooks = fs.readdirSync(path.join(PKG_ROOT, 'hooks'))
    .filter(f => f.endsWith('.js'));
  for (const h of allHooks) {
    const src = path.join(PKG_ROOT, 'hooks', h);
    fs.copyFileSync(src, path.join(hooksDir, h));
  }

  // Copy keyword-map.json alongside hooks
  const kwSrc = path.join(PKG_ROOT, 'hooks', 'keyword-map.json');
  if (fs.existsSync(kwSrc)) fs.copyFileSync(kwSrc, path.join(hooksDir, 'keyword-map.json'));

  // Commands (.claude/commands/*.md → slash commands)
  for (const f of fs.readdirSync(path.join(PKG_ROOT, 'commands'))) {
    fs.copyFileSync(path.join(PKG_ROOT, 'commands', f), path.join(cmdsDir, f));
  }

  // Agents (.claude/agents/*.md → subagents)
  for (const f of fs.readdirSync(path.join(PKG_ROOT, 'agents'))) {
    fs.copyFileSync(path.join(PKG_ROOT, 'agents', f), path.join(agentsDir, f));
  }

  // Skills (.claude/skills/<name>/SKILL.md + references/ + scripts/)
  for (const skill of fs.readdirSync(path.join(PKG_ROOT, 'skills'))) {
    const src = path.join(PKG_ROOT, 'skills', skill);
    if (fs.statSync(src).isDirectory()) copyDir(src, path.join(skillsDir, skill));
  }

  // Scripts (.claude/scripts/ for runtime support)
  const scriptsSrc = path.join(PKG_ROOT, 'scripts');
  if (fs.existsSync(scriptsSrc)) copyDir(scriptsSrc, path.join(CWD, '.claude', 'scripts'));
}

function writeCursor({ selectedMcp, mcpKeys, platforms }) {
  // Cursor loads .claude/agents/, .claude/skills/, .claude/hooks.json for compatibility.
  // If Claude Code wasn't selected, seed .claude/ ourselves so Cursor can find them.
  if (!platforms.includes('Claude Code')) writeClaudeFiles();

  const rulesDir = path.join(CWD, '.cursor', 'rules');
  mkdir(rulesDir);
  for (const name of ['ohc-core','ohc-memory','ohc-discipline']) {
    const src = path.join(PKG_ROOT, 'templates', 'cursor-rules', `${name}.template.mdc`);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(rulesDir, `${name}.mdc`));
  }
  write(path.join(rulesDir, 'ohc-tdd.mdc'),
    `---\ndescription: TDD enforcement for test files\nglobs: ["**/*.test.ts","**/*.test.js","**/*.spec.ts","**/test_*.py"]\n---\n# TDD Rule\nWrite failing test first. Confirm it fails. Then write minimum implementation.\n`);

  // Cursor-native MCP config: .cursor/mcp.json
  const mcpServers = {};
  const cursorExcludes = ['context7', 'figma', 'sentry'];
  for (const srv of selectedMcp) {
    if (cursorExcludes.includes(srv.name)) continue;
    const env = {};
    const keys = mcpKeys[srv.name];
    if (keys) for (const [k, v] of Object.entries(keys)) env[k] = v;
    if (srv.url) {
      mcpServers[srv.name] = { url: srv.url, env };
    } else {
      const args = [...srv.args];
      if (srv.name === 'context7' && keys?.CONTEXT7_API_KEY) args.push('--api-key', keys.CONTEXT7_API_KEY);
      mcpServers[srv.name] = { command: srv.command, args, env };
    }
  }

  const mcpPath = path.join(CWD, '.cursor', 'mcp.json');
  let existing = {};
  try { existing = JSON.parse(fs.readFileSync(mcpPath, 'utf8')); } catch {}
  write(mcpPath, JSON.stringify({
    ...existing,
    mcpServers: {
      ...(existing.mcpServers || {}),
      ...mcpServers
    }
  }, null, 2));
}

function writeAntigravity({ selectedMcp, mcpKeys }) {
  // Project scope: .agents/{rules,skills,workflows}
  const root = path.join(CWD, '.agents');
  const rulesDir     = path.join(root, 'rules');
  const skillsDir    = path.join(root, 'skills');
  const workflowsDir = path.join(root, 'workflows');
  mkdir(rulesDir); mkdir(skillsDir); mkdir(workflowsDir);

  for (const name of ['ohc-core','ohc-discipline','ohc-memory']) {
    const src = path.join(PKG_ROOT, 'templates', 'antigravity', `${name}.md`);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(rulesDir, `${name}.md`));
  }
  for (const skill of fs.readdirSync(path.join(PKG_ROOT, 'skills'))) {
    const src = path.join(PKG_ROOT, 'skills', skill);
    if (fs.statSync(src).isDirectory()) copyDir(src, path.join(skillsDir, skill));
  }

  // Scripts (.agents/scripts/ for runtime support)
  const scriptsSrc = path.join(PKG_ROOT, 'scripts');
  if (fs.existsSync(scriptsSrc)) copyDir(scriptsSrc, path.join(root, 'scripts'));

  const commandsDir = path.join(PKG_ROOT, 'commands');
  for (const f of fs.readdirSync(commandsDir)) {
    if (f === 'ohc-setup.md') continue;
    const src = path.join(commandsDir, f);
    const name = path.basename(f, '.md');
    if (fs.existsSync(src)) {
      let content = fs.readFileSync(src, 'utf8');
      if (!content.includes('trigger:')) {
        content = content.replace(/^---/, `---\ntrigger: /${name}`);
      }
      // Clean up description: remove "<NAME> workflow:" prefix, replace arrows, shorten if needed
      content = content.replace(/^description:\s*(.*)/m, (_, d) => {
        let clean = d
          .replace(/^[A-Z]+\s+workflow:\s*/i, '')
          .replace(/→/g, '->')
          .replace(/[\[\]]/g, '')
          .trim();
        if (clean.length > 100) clean = clean.substring(0, 97) + '...';
        return `description: ${clean}`;
      });
      write(path.join(workflowsDir, f), content);
    }
  }

  // Global scope: ~/.gemini/antigravity/mcp_config.json
  const mcpServers = {};
  for (const srv of selectedMcp) {
    const env = {};
    const keys = mcpKeys[srv.name];
    if (keys) for (const [k, v] of Object.entries(keys)) env[k] = v;
    // Antigravity expects streamable HTTP as `serverUrl`, not `url` (see https://antigravity.google/docs/mcp).
    if (srv.url) {
      mcpServers[srv.name] = { serverUrl: srv.url, env };
    } else {
      const args = [...srv.args];
      if (srv.name === 'context7' && keys?.CONTEXT7_API_KEY) args.push('--api-key', keys.CONTEXT7_API_KEY);
      mcpServers[srv.name] = { command: srv.command, args, env };
    }
  }

  const mcpPath = path.join(os.homedir(), '.gemini', 'antigravity', 'mcp_config.json');
  let existing = {};
  try { existing = JSON.parse(fs.readFileSync(mcpPath, 'utf8')); } catch {}
  write(mcpPath, JSON.stringify({
    ...existing,
    mcpServers: {
      ...(existing.mcpServers || {}),
      ...mcpServers
    }
  }, null, 2));
}

function writeGemini({ project, selectedMcp, mcpKeys }) {
  // Project-level context file (read by Gemini CLI at project root)
  write(path.join(CWD, 'GEMINI.md'), fill(tmpl('GEMINI.template.md'), { project_name: project.projectName }));

  const mcpServers = {};
  for (const srv of selectedMcp) {
    const env = {};
    const keys = mcpKeys[srv.name];
    if (keys) for (const [k, v] of Object.entries(keys)) env[k] = v;
    if (srv.url) {
      mcpServers[srv.name] = { url: srv.url, env };
    } else {
      const args = [...srv.args];
      if (srv.name === 'context7' && keys?.CONTEXT7_API_KEY) {
        args.push('--api-key', keys.CONTEXT7_API_KEY);
      }
      mcpServers[srv.name] = { command: srv.command, args, env };
    }
  }

  // Write to ~/.gemini/settings.json for Gemini MCP support
  const settingsPath = path.join(os.homedir(), '.gemini', 'settings.json');
  let existingSettings = {};
  try { existingSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); } catch {}
  write(settingsPath, JSON.stringify({
    ...existingSettings,
    mcpServers: {
      ...(existingSettings.mcpServers || {}),
      ...mcpServers
    }
  }, null, 2));
}

function writeCodex({ selectedMcp, mcpKeys }) {
  // Codex CLI reads AGENTS.md at the project root — produced by genAgents().
  // User-scope prompts dir (custom slash commands) and MCP config live under ~/.codex/.
  // Official skills discovery: $REPO_ROOT/.agents/skills (see OpenAI Codex skills docs).
  const codexHome    = path.join(os.homedir(), '.codex');
  const promptsDir   = path.join(codexHome, 'prompts');
  mkdir(codexHome); mkdir(promptsDir);

  const agentsSkills = path.join(CWD, '.agents', 'skills');
  mkdir(path.join(CWD, '.agents'));
  mkdir(agentsSkills);
  for (const skill of fs.readdirSync(path.join(PKG_ROOT, 'skills'))) {
    const src = path.join(PKG_ROOT, 'skills', skill);
    if (fs.statSync(src).isDirectory()) copyDir(src, path.join(agentsSkills, skill));
  }

  // Expose OHC commands as Codex prompts (~/.codex/prompts/<name>.md)
  for (const f of fs.readdirSync(path.join(PKG_ROOT, 'commands'))) {
    fs.copyFileSync(path.join(PKG_ROOT, 'commands', f), path.join(promptsDir, f));
  }

  // MCP servers in TOML under [mcp_servers.<name>]
  const configPath = path.join(codexHome, 'config.toml');
  let existing = '';
  try { existing = fs.readFileSync(configPath, 'utf8'); } catch {}
  const managedStart = '# >>> oh-my-colab managed mcp_servers';
  const managedEnd   = '# <<< oh-my-colab managed mcp_servers';
  const stripped = existing.replace(
    new RegExp(`\\n?${managedStart}[\\s\\S]*?${managedEnd}\\n?`, 'g'), ''
  ).trimEnd();

  const toTomlString = s => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  const blocks = selectedMcp.map(srv => {
    const keys = mcpKeys[srv.name] || {};
    const envEntries = Object.entries(keys).map(([k, v]) => `${k} = ${toTomlString(v)}`).join(', ');
    if (srv.url) {
      return [`[mcp_servers.${srv.name}]`, `url = ${toTomlString(srv.url)}`, envEntries ? `env = { ${envEntries} }` : null].filter(Boolean).join('\n');
    }
    const args = [...srv.args];
    if (srv.name === 'context7' && keys.CONTEXT7_API_KEY) args.push('--api-key', keys.CONTEXT7_API_KEY);
    return [
      `[mcp_servers.${srv.name}]`,
      `command = ${toTomlString(srv.command)}`,
      `args = [${args.map(toTomlString).join(', ')}]`,
      envEntries ? `env = { ${envEntries} }` : null,
    ].filter(Boolean).join('\n');
  }).join('\n\n');

  const managed = blocks ? `\n${managedStart}\n${blocks}\n${managedEnd}\n` : '';
  write(configPath, (stripped ? stripped + '\n' : '') + managed);
}

function installMcp({ selectedMcp, mcpKeys }) {
  const existingOnClaude = configuredMcpServersOnClaude();
  for (const srv of selectedMcp) {
    if (existingOnClaude.has(srv.name)) continue;
    try {
      let cmd = `claude mcp add --scope user ${srv.name}`;
      const keys = mcpKeys[srv.name];
      if (keys) {
        for (const [k, v] of Object.entries(keys)) cmd += ` -e ${k}=${v}`;
      }
      // Context7 with optional key
      if (srv.url) {
        cmd += ` ${srv.url}`;
      } else if (srv.name === 'context7' && keys?.CONTEXT7_API_KEY) {
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
    const map = { 'Full (3 lines)': 'full', 'Standard (2 lines)': 'standard', 'Minimal (1 line)': 'minimal' };
    let c = fs.readFileSync(src, 'utf8');
    c = c.replace(/^OHC_HUD_STYLE=.*/m, `OHC_HUD_STYLE="${map[hudStyle] || 'full'}"`);
    write(dst, c, { mode: 0o755 });
  }
}

function writeConfig({ platforms, teamMode, workflow, hudStyle }) {
  const { version } = require(path.join(PKG_ROOT, 'package.json'));
  const configPath = path.join(os.homedir(), '.ohc', 'config.json');
  let existing = {};
  try { existing = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch {}
  write(configPath, JSON.stringify({
    ...existing,
    version, platforms, teamMode,
    defaultWorkflow: workflow, hudStyle,
    installedAt: new Date().toISOString()
  }, null, 2));
}

// ── GitHub Star Prompt ──────────────────────────────────────────────────────

/**
 * Prompt user to star the repo at end of onboarding.
 * Hybrid approach:
 *   - If GITHUB_PERSONAL_ACCESS_TOKEN was provided during MCP setup → use GitHub API
 *   - Otherwise → open browser to the repo page
 * One-time: writes starPromptShown to ~/.ohc/config.json
 */
async function promptStar({ mcpKeys }) {
  const configPath = path.join(os.homedir(), '.ohc', 'config.json');
  let config = {};
  try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch {}
  if (config.starPromptShown) return;

  const REPO = 'iadr-dev/colab';
  const REPO_URL = `https://github.com/${REPO}`;

  process.stdout.write('  ⭐ Enjoying oh-my-colab? Star us on GitHub!\n');
  process.stdout.write(`     ${REPO_URL}\n\n`);

  const pat = mcpKeys?.github?.GITHUB_PERSONAL_ACCESS_TOKEN
           || process.env.GITHUB_PERSONAL_ACCESS_TOKEN
           || null;

  const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout });

  const answer = await new Promise(resolve => {
    rl.question(pat
      ? '  Star the repo now? We\'ll use your GitHub token. (y/N) '
      : '  Open the repo in your browser to star it? (y/N) ',
      a => { rl.close(); resolve((a || '').trim().toLowerCase()); }
    );
  });

  if (answer === 'y' || answer === 'yes') {
    if (pat) {
      // Use GitHub API: PUT /user/starred/:owner/:repo
      try {
        const https = require('https');
        await new Promise((resolve, reject) => {
          const req = https.request({
            hostname: 'api.github.com',
            path: `/user/starred/${REPO}`,
            method: 'PUT',
            headers: {
              'Authorization': `token ${pat}`,
              'User-Agent': 'oh-my-colab-setup',
              'Accept': 'application/vnd.github.v3+json',
              'Content-Length': 0
            }
          }, res => {
            if (res.statusCode === 204 || res.statusCode === 304) {
              process.stdout.write('  ✓ Starred! Thank you for supporting oh-my-colab 🎉\n\n');
              resolve();
            } else {
              // Non-fatal — fall back to browser
              process.stdout.write(`  ⚠ API returned ${res.statusCode}. Opening browser instead...\n`);
              openBrowser(REPO_URL);
              resolve();
            }
            res.resume();
          });
          req.on('error', () => { openBrowser(REPO_URL); resolve(); });
          req.end();
        });
      } catch {
        openBrowser(REPO_URL);
      }
    } else {
      openBrowser(REPO_URL);
    }
  } else {
    process.stdout.write('  No worries — you can star us anytime at ' + REPO_URL + '\n\n');
  }

  // Mark as shown so we don't ask again
  try {
    config.starPromptShown = true;
    write(configPath, JSON.stringify(config, null, 2));
  } catch {}
}

function openBrowser(url) {
  try {
    const platform = process.platform;
    if (platform === 'darwin')       execSync(`open "${url}"`, { stdio: 'ignore' });
    else if (platform === 'win32')   execSync(`start "" "${url}"`, { stdio: 'ignore' });
    else                             execSync(`xdg-open "${url}"`, { stdio: 'ignore' });
    process.stdout.write('  ✓ Opened in browser — click ⭐ to star! Thank you 🎉\n\n');
  } catch {
    process.stdout.write(`  Could not open browser. Visit: ${url}\n\n`);
  }
}

module.exports = run;

if (require.main === module) {
  run().catch(e => { process.stderr.write(`Setup error: ${e.message}\n`); process.exit(1); });
}
