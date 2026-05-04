/**
 * tests/unit/scripts/utils/masked-input.test.js
 */
const { maskedInput } = require('../../../../scripts/utils/masked-input');

describe('masked-input.js', () => {
  let stdinOnSpy, stdinRemoveListenerSpy, stdinSetRawModeSpy, stdinResumeSpy, stdinPauseSpy, stdinSetEncodingSpy;
  let stdoutWriteSpy, stdoutClearLineSpy, stdoutCursorToSpy;
  let isTTYOrig;

  beforeEach(() => {
    isTTYOrig = process.stdin.isTTY;
    process.stdin.isTTY = true;
    if (!process.stdin.setRawMode) process.stdin.setRawMode = () => {};
    if (!process.stdin.resume) process.stdin.resume = () => {};
    if (!process.stdin.pause) process.stdin.pause = () => {};
    if (!process.stdin.setEncoding) process.stdin.setEncoding = () => {};

    stdinOnSpy = vi.spyOn(process.stdin, 'on').mockImplementation(() => {});
    stdinRemoveListenerSpy = vi.spyOn(process.stdin, 'removeListener').mockImplementation(() => {});
    stdinSetRawModeSpy = vi.spyOn(process.stdin, 'setRawMode').mockImplementation(() => {});
    stdinResumeSpy = vi.spyOn(process.stdin, 'resume').mockImplementation(() => {});
    stdinPauseSpy = vi.spyOn(process.stdin, 'pause').mockImplementation(() => {});
    stdinSetEncodingSpy = vi.spyOn(process.stdin, 'setEncoding').mockImplementation(() => {});

    if (!process.stdout.clearLine) process.stdout.clearLine = () => {};
    if (!process.stdout.cursorTo) process.stdout.cursorTo = () => {};

    stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => {});
    stdoutClearLineSpy = vi.spyOn(process.stdout, 'clearLine').mockImplementation(() => {});
    stdoutCursorToSpy = vi.spyOn(process.stdout, 'cursorTo').mockImplementation(() => {});
  });

  afterEach(() => {
    process.stdin.isTTY = isTTYOrig;
    vi.restoreAllMocks();
  });

  it('returns default on non-TTY', async () => {
    process.stdin.isTTY = false;
    const res = await maskedInput('Prompt', 'Label');
    expect(res).toEqual({ value: '', skipped: true });
  });

  it('handles input and return', async () => {
    const promise = maskedInput('Prompt', 'Label');
    const handler = stdinOnSpy.mock.calls.find(c => c[0] === 'keypress')[1];
    
    handler('a', { name: 'a' });
    handler('b', { name: 'b' });
    handler('', { name: 'return' });

    const res = await promise;
    expect(res).toEqual({ value: 'ab', skipped: false });
  });

  it('handles backspace', async () => {
    const promise = maskedInput('Prompt', 'Label');
    const handler = stdinOnSpy.mock.calls.find(c => c[0] === 'keypress')[1];
    
    handler('a', { name: 'a' });
    handler('b', { name: 'b' });
    handler('', { name: 'backspace' });
    handler('', { name: 'return' });

    const res = await promise;
    expect(res).toEqual({ value: 'a', skipped: false });
  });

  it('handles ctrl+c to skip', async () => {
    const promise = maskedInput('Prompt', 'Label');
    const handler = stdinOnSpy.mock.calls.find(c => c[0] === 'keypress')[1];
    
    handler('', { name: 'c', ctrl: true });

    const res = await promise;
    expect(res).toEqual({ value: '', skipped: true });
  });
});
