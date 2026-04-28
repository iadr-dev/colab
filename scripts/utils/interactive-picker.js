/**
 * interactive-picker.js — arrow-key terminal UI component
 * single-select: arrows + Enter | multi-select: arrows + Space + Enter
 */
const readline = require('readline');

function picker({ title, subtitle, options, multiSelect = false, defaults = [] }) {
  return new Promise(resolve => {
    let cursor = 0;
    const selected = new Set(defaults);
    const { stdin, stdout } = process;
    if (!stdin.isTTY) {
      resolve(multiSelect ? [...defaults] : [defaults[0] || options[0]]);
      return;
    }
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    readline.emitKeypressEvents(stdin);
    const W = 52;
    const bar = '═'.repeat(W - 2);

    function render() {
      stdout.write('\x1B[?25l\x1B[2J\x1B[H');
      stdout.write(`╔${bar}╗\n║  ${title.padEnd(W - 4)}║\n║  ${subtitle.padEnd(W - 4)}║\n╠${bar}╣\n`);
      options.forEach((opt, i) => {
        const sel = selected.has(opt);
        const cur = i === cursor;
        const mark = multiSelect ? (sel ? '[✓]' : '[ ]') : (cur ? ' ▶ ' : '   ');
        stdout.write(`║  ${(mark + ' ' + opt).padEnd(W - 4)}║\n`);
      });
      stdout.write(`╚${bar}╝\n`);
    }

    function done() { stdin.setRawMode(false); stdin.pause(); stdout.write('\x1B[?25h'); }

    render();
    stdin.on('keypress', (ch, key) => {
      if (!key) return;
      if (key.name === 'up')   { cursor = (cursor - 1 + options.length) % options.length; render(); }
      if (key.name === 'down') { cursor = (cursor + 1) % options.length; render(); }
      if (key.name === 'space' && multiSelect) {
        const o = options[cursor];
        selected.has(o) ? selected.delete(o) : selected.add(o);
        render();
      }
      if (key.name === 'return') {
        done();
        resolve(multiSelect ? (selected.size ? [...selected] : null) : [options[cursor]]);
      }
      if (key.ctrl && key.name === 'c') { done(); resolve(null); }
    });
  });
}

module.exports = { picker };
