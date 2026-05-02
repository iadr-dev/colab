/**
 * Resolve oh-my-colab asset paths for hooks whether running from:
 * - this repo (skills/, hooks/ at project root), or
 * - an installed project (.claude/skills, .claude/hooks).
 */
const fs = require('fs');
const path = require('path');

function keywordMapJson(cwd) {
  const besideHook = path.join(__dirname, 'keyword-map.json');
  if (fs.existsSync(besideHook)) return besideHook;

  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
  if (pluginRoot) {
    const bundled = path.join(pluginRoot, 'hooks', 'keyword-map.json');
    if (fs.existsSync(bundled)) return bundled;
  }

  const claudeHooks = path.join(cwd, '.claude', 'hooks', 'keyword-map.json');
  if (fs.existsSync(claudeHooks)) return claudeHooks;
  return path.join(cwd, 'hooks', 'keyword-map.json');
}

function skillSkillMd(cwd, skill) {
  const deployed = path.join(cwd, '.claude', 'skills', skill, 'SKILL.md');
  if (fs.existsSync(deployed)) {
    return { abs: deployed, rel: `.claude/skills/${skill}/SKILL.md` };
  }

  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
  if (pluginRoot) {
    const bundled = path.join(pluginRoot, 'skills', skill, 'SKILL.md');
    if (fs.existsSync(bundled)) {
      return { abs: bundled, rel: `skills/${skill}/SKILL.md` };
    }
  }

  const src = path.join(cwd, 'skills', skill, 'SKILL.md');
  return { abs: src, rel: `skills/${skill}/SKILL.md` };
}

module.exports = { keywordMapJson, skillSkillMd };
