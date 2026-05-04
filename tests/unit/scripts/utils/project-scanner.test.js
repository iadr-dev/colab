/**
 * tests/unit/scripts/utils/project-scanner.test.js
 */
const { scan } = require('../../../../scripts/utils/project-scanner');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('project-scanner.js', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-scan-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('scans project correctly', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'test', dependencies: { 'react': '1.0' } }));
    fs.writeFileSync(path.join(tmpDir, 'index.js'), 'console.log("hello");');
    fs.mkdirSync(path.join(tmpDir, 'src'));
    fs.writeFileSync(path.join(tmpDir, 'src', 'index.ts'), 'console.log("app");');

    const result = scan(tmpDir);
    expect(result).toMatchObject({
      projectName: 'test',
      language: 'JavaScript',
      framework: 'React',
      mainEntry: 'src/index.ts'
    });
  });

  it('ignores node_modules and .git by default (only checks specific config files)', () => {
    fs.mkdirSync(path.join(tmpDir, 'node_modules'));
    fs.writeFileSync(path.join(tmpDir, 'node_modules', 'test.js'), 'console.log("test");');
    fs.mkdirSync(path.join(tmpDir, '.git'));
    fs.writeFileSync(path.join(tmpDir, '.git', 'config'), 'url = https://github.com/test/repo.git');

    const result = scan(tmpDir);
    expect(result.gitRemote).toBe('https://github.com/test/repo.git');
    expect(result.projectName).toBe(path.basename(tmpDir));
  });
});
