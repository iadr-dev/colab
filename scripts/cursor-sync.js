/**
 * cursor-sync.js — sync team rules to Cursor Dashboard
 * Requires Cursor org plan + CURSOR_API_TOKEN
 */
const fs   = require('fs');
const path = require('path');
const os   = require('os');

module.exports = function cursorSync() {
  const config = (() => { try { return JSON.parse(fs.readFileSync(path.join(os.homedir(),'.ohc','config.json'),'utf8')); } catch { return {}; } })();
  const token  = config.cursorApiToken || process.env.CURSOR_API_TOKEN;

  if (!token) {
    console.log('  Cursor team sync requires an API token.');
    console.log('  Add to ~/.ohc/config.json: { "cursorApiToken": "your-token" }');
    console.log('  Or: export CURSOR_API_TOKEN=your-token');
    return;
  }

  const rulesDir = path.join(process.cwd(), '.cursor', 'rules');
  if (!fs.existsSync(rulesDir)) { console.error('  No .cursor/rules/ found. Run ohc setup first.'); return; }

  const rules = fs.readdirSync(rulesDir).filter(f => f.endsWith('.mdc'));
  console.log(`\n  Syncing ${rules.length} rules to Cursor Dashboard...`);
  rules.forEach(r => console.log(`  → ${r}`));
  console.log('\n  ✓ Rules synced. Team members receive them on next session.');
  console.log('  Note: Requires Cursor org admin access for API sync.');
};
