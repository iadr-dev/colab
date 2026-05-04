/**
 * tests/unit/scripts/team/native.test.js
 */
const { 
  buildTaskSpecs, formatDispatchInstruction,
  buildFixTaskSpecs, formatFixDispatchInstruction
} = require('../../../../scripts/team/native');

describe('team/native.js', () => {
  describe('buildTaskSpecs', () => {
    it('builds task specs correctly', () => {
      const workers = [
        { name: 'w1', worktree: '/path/w1', task: 'Implement feature A' },
        { name: 'w2', worktree: '/path/w2', task: 'Implement feature B' }
      ];
      const { taskSpecs } = buildTaskSpecs('t1', 'claude', workers);
      
      expect(taskSpecs).toHaveLength(2);
      expect(taskSpecs[0].subagent_type).toBe('generalPurpose');
      expect(taskSpecs[0].workerName).toBe('w1');
      expect(taskSpecs[0].description).toContain('worker 1');
      expect(taskSpecs[0].prompt).toContain('You are worker w1');
      expect(taskSpecs[0].prompt).toContain('team t1');
      expect(taskSpecs[0].prompt).toContain('/path/w1');
      expect(taskSpecs[0].prompt).toContain('RESULT.json');
    });

    it('builds task specs for executor provider', () => {
      const workers = [{ name: 'w1', worktree: '/path/w1', task: 'test' }];
      const { taskSpecs } = buildTaskSpecs('t1', 'executor', workers);
      expect(taskSpecs[0].subagent_type).toBe('executor');
    });
  });

  describe('formatDispatchInstruction', () => {
    it('returns empty string if no specs', () => {
      expect(formatDispatchInstruction([])).toBe('');
    });

    it('formats instruction correctly', () => {
      const specs = [{ subagent_type: 'executor', workerName: 'w1' }];
      const instruction = formatDispatchInstruction(specs);
      expect(instruction).toContain('<system_reminder team_dispatch="true">');
      expect(instruction).toContain('Dispatch the following 1 Task()');
      expect(instruction).toContain('"workerName": "w1"');
    });
  });

  describe('buildFixTaskSpecs', () => {
    it('builds fix task specs correctly', () => {
      const failingWorkers = [
        { 
          name: 'w1', worktree: '/path/w1', branch: 'b1', 
          prior_result: { status: 'failed', tests: { failed: 1 }, notes: 'broken', files_changed: [] } 
        }
      ];
      const { taskSpecs } = buildFixTaskSpecs('t1', 'claude', failingWorkers, 2);
      
      expect(taskSpecs).toHaveLength(1);
      expect(taskSpecs[0].subagent_type).toBe('generalPurpose');
      expect(taskSpecs[0].workerName).toBe('w1');
      expect(taskSpecs[0].isFixPass).toBe(true);
      expect(taskSpecs[0].attempt).toBe(2);
      expect(taskSpecs[0].description).toContain('fix-2 w1');
      expect(taskSpecs[0].prompt).toContain('attempt 2/3');
      expect(taskSpecs[0].prompt).toContain('failed');
      expect(taskSpecs[0].prompt).toContain('broken');
      expect(taskSpecs[0].prompt).toContain('continue the SAME branch: b1');
    });

    it('handles missing prior result', () => {
      const failingWorkers = [
        { name: 'w1', worktree: '/path/w1', branch: 'b1' }
      ];
      const { taskSpecs } = buildFixTaskSpecs('t1', 'claude', failingWorkers, 1);
      expect(taskSpecs[0].prompt).toContain('no prior RESULT.json');
    });
  });

  describe('formatFixDispatchInstruction', () => {
    it('returns empty string if no specs', () => {
      expect(formatFixDispatchInstruction([], 't1', 1)).toBe('');
    });

    it('formats instruction correctly', () => {
      const specs = [{ subagent_type: 'executor', workerName: 'w1' }];
      const instruction = formatFixDispatchInstruction(specs, 't1', 2);
      expect(instruction).toContain('<system_reminder team_fix_dispatch="true" attempt="2">');
      expect(instruction).toContain('Team t1: verify failed');
      expect(instruction).toContain('attempt 2/3');
      expect(instruction).toContain('"workerName": "w1"');
    });
  });
});
