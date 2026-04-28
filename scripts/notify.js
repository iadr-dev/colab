/**
 * notify.js — send notifications
 */
const fs    = require('fs');
const path  = require('path');
const os    = require('os');
const https = require('https');

module.exports = function notify(args) {
  const isSum = args.includes('--summary');
  const msg   = isSum ? getSummary() : args.filter(a => !a.startsWith('-')).join(' ');
  if (!msg) { console.error('Usage: ohc notify "message" | ohc notify --summary'); return; }
  const config = getConfig();
  if (!config.notifications?.provider || config.notifications.provider === 'none') {
    console.log('No notification provider configured. Run ohc setup to configure.'); return;
  }
  send(config.notifications, msg).then(() => console.log('✓ Notification sent'));
};

function getConfig() {
  try { return JSON.parse(fs.readFileSync(path.join(os.homedir(), '.ohc', 'config.json'), 'utf8')); }
  catch { return {}; }
}

function getSummary() {
  try {
    const sessions = path.join(process.cwd(), '.ohc', 'state', 'sessions');
    const latest   = fs.readdirSync(sessions).sort().reverse()[0];
    return fs.readFileSync(path.join(sessions, latest, 'summary.md'), 'utf8').split('\n').slice(0, 5).join('\n');
  } catch { return 'oh-my-colab session complete'; }
}

async function send({ provider, webhookUrl }, message) {
  const url  = new URL(webhookUrl || '');
  const body = JSON.stringify(provider === 'discord'
    ? { embeds: [{ title: '🧠 oh-my-colab', description: message, color: 0x7c3aed }] }
    : { text: message }
  );
  return new Promise(res => {
    const req = https.request({
      hostname: url.hostname, path: url.pathname + url.search, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, r => { r.resume(); res(); });
    req.on('error', res);
    req.write(body); req.end();
  });
}
