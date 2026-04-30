/**
 * masked-input.js — API key input with masking
 * Enter=confirm, Ctrl+C=skip
 */
const readline = require('readline');

function maskedInput(prompt, label) {
  return new Promise(resolve => {
    const { stdin, stdout } = process;
    if (!stdin.isTTY) { resolve({ value: '', skipped: true }); return; }
    stdout.write(`\n  ${prompt}\n  ${label}:\n  > `);
    let value = '';
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    readline.emitKeypressEvents(stdin);
    function done() {
      stdin.removeListener('keypress', onKeypress);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write('\n');
    }
    function onKeypress(ch, key) {
      if (!key) return;
      if (key.ctrl && key.name === 'c') { done(); resolve({ value: '', skipped: true }); return; }
      if (key.name === 'return') { done(); resolve({ value, skipped: false }); return; }
      if (key.name === 'backspace') {
        value = value.slice(0, -1);
        stdout.clearLine(0); stdout.cursorTo(2);
        stdout.write('> ' + '*'.repeat(value.length));
        return;
      }
      if (ch && !key.ctrl && !key.meta) {
        value += ch;
        stdout.clearLine(0); stdout.cursorTo(2);
        stdout.write('> ' + '*'.repeat(value.length - 1) + ch);
      }
    }
    stdin.on('keypress', onKeypress);
  });
}

module.exports = { maskedInput };
