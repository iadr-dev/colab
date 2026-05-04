/**
 * tests/unit/scripts/utils/interactive-picker.test.js
 */
const { picker } = require('../../../../scripts/utils/interactive-picker');

describe('interactive-picker.js', () => {
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
    if (!process.stdout.clearLine) process.stdout.clearLine = () => {};
    if (!process.stdout.cursorTo) process.stdout.cursorTo = () => {};

    stdinOnSpy = vi.spyOn(process.stdin, 'on').mockImplementation(() => {});
    stdinRemoveListenerSpy = vi.spyOn(process.stdin, 'removeListener').mockImplementation(() => {});
    stdinSetRawModeSpy = vi.spyOn(process.stdin, 'setRawMode').mockImplementation(() => {});
    stdinResumeSpy = vi.spyOn(process.stdin, 'resume').mockImplementation(() => {});
    stdinPauseSpy = vi.spyOn(process.stdin, 'pause').mockImplementation(() => {});
    stdinSetEncodingSpy = vi.spyOn(process.stdin, 'setEncoding').mockImplementation(() => {});

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
    const res = await picker({ title: 'T', subtitle: 'S', options: ['A', 'B'], defaults: ['A'] });
    expect(res).toEqual(['A']);
  });

  it('handles single select (arrow down, return)', async () => {
    const promise = picker({ title: 'T', subtitle: 'S', options: ['A', 'B'] });
    const handler = stdinOnSpy.mock.calls.find(c => c[0] === 'keypress')[1];
    
    handler('', { name: 'down' });
    handler('', { name: 'return' });

    const res = await promise;
    expect(res).toEqual(['B']);
  });

  it('handles multi select (space, arrow down, space, return)', async () => {
    const promise = picker({ title: 'T', subtitle: 'S', options: ['A', 'B'], multiSelect: true });
    const handler = stdinOnSpy.mock.calls.find(c => c[0] === 'keypress')[1];
    
    handler('', { name: 'space' }); // toggle A
    handler('', { name: 'down' }); // move to B
    handler('', { name: 'space' }); // toggle B
    handler('', { name: 'space' }); // toggle B off
    handler('', { name: 'return' });

    const res = await promise;
    expect(res).toEqual(['A']);
  });

  it('handles ctrl+c to abort', async () => {
    const promise = picker({ title: 'T', subtitle: 'S', options: ['A', 'B'] });
    const handler = stdinOnSpy.mock.calls.find(c => c[0] === 'keypress')[1];
    
    handler('', { name: 'c', ctrl: true });

    const res = await promise;
    expect(res).toBeNull();
  });
});
