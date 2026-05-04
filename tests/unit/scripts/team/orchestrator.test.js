/**
 * tests/unit/scripts/team/orchestrator.test.js
 */
const orchestrator = require('../../../../scripts/team/orchestrator');
const state = require('../../../../scripts/team/state');
const res = require('../../../../scripts/team/result');

describe('team/orchestrator.js', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(state, 'readState').mockImplementation(() => null);
    vi.spyOn(state, 'updateState').mockImplementation(() => {});
    vi.spyOn(state, 'recordHandoff').mockImplementation(() => {});
    vi.spyOn(res, 'allComplete').mockImplementation(() => false);
    vi.spyOn(res, 'summarize').mockImplementation(() => ({}));
  });

  describe('current', () => {
    it('returns null if no state', () => {
      state.readState.mockReturnValue(null);
      expect(orchestrator.current('t1')).toBeNull();
    });

    it('returns stage if state exists', () => {
      state.readState.mockReturnValue({ stage: 'team-plan' });
      expect(orchestrator.current('t1')).toBe('team-plan');
    });
  });

  describe('nextStageFor', () => {
    it('team-plan -> team-prd', () => {
      expect(orchestrator.nextStageFor('t1', 'team-plan', {})).toBe('team-prd');
    });

    it('team-prd -> team-exec', () => {
      expect(orchestrator.nextStageFor('t1', 'team-prd', {})).toBe('team-exec');
    });

    it('team-exec -> team-verify if all complete', () => {
      res.allComplete.mockReturnValue(true);
      expect(orchestrator.nextStageFor('t1', 'team-exec', {})).toBe('team-verify');
    });

    it('team-exec -> null if not all complete', () => {
      res.allComplete.mockReturnValue(false);
      expect(orchestrator.nextStageFor('t1', 'team-exec', {})).toBeNull();
    });

    it('team-verify -> team-merge if no failures', () => {
      res.summarize.mockReturnValue({ failed: 0, tests_failed: 0, blocked: 0 });
      expect(orchestrator.nextStageFor('t1', 'team-verify', {})).toBe('team-merge');
    });

    it('team-verify -> team-fix if failures and under max retries', () => {
      res.summarize.mockReturnValue({ failed: 1, tests_failed: 0, blocked: 0 });
      expect(orchestrator.nextStageFor('t1', 'team-verify', { fix_retries: 1 })).toBe('team-fix');
    });

    it('team-verify -> team-merge if failures but hit max retries', () => {
      res.summarize.mockReturnValue({ failed: 1, tests_failed: 0, blocked: 0 });
      expect(orchestrator.nextStageFor('t1', 'team-verify', { fix_retries: orchestrator.MAX_FIX_RETRIES })).toBe('team-merge');
    });

    it('team-fix -> team-verify if all complete', () => {
      res.allComplete.mockReturnValue(true);
      expect(orchestrator.nextStageFor('t1', 'team-fix', {})).toBe('team-verify');
    });

    it('team-merge -> done', () => {
      expect(orchestrator.nextStageFor('t1', 'team-merge', {})).toBe('done');
    });
  });

  describe('advance', () => {
    it('returns false if team not found', () => {
      state.readState.mockReturnValue(null);
      const res = orchestrator.advance('t1');
      expect(res.advanced).toBe(false);
      expect(res.reason).toBe('team not found');
    });

    it('returns false if already complete', () => {
      state.readState.mockReturnValue({ stage: 'done' });
      const res = orchestrator.advance('t1');
      expect(res.advanced).toBe(false);
      expect(res.from).toBe('done');
    });

    it('returns false if blocked', () => {
      state.readState.mockReturnValue({ stage: 'team-exec' });
      res.allComplete.mockReturnValue(false);
      const result = orchestrator.advance('t1');
      expect(result.advanced).toBe(false);
      expect(result.reason).toContain('blocked');
    });

    it('advances stage and records handoff', () => {
      state.readState.mockReturnValue({ stage: 'team-plan' });
      const result = orchestrator.advance('t1');
      expect(result.advanced).toBe(true);
      expect(result.to).toBe('team-prd');
      expect(state.recordHandoff).toHaveBeenCalledWith('t1', 'team-plan', 'team-prd', expect.any(Object));
    });
  });

  describe('recordFixAttempt', () => {
    it('increments fix_retries', () => {
      state.readState.mockReturnValue({ fix_retries: 1 });
      orchestrator.recordFixAttempt('t1');
      expect(state.updateState).toHaveBeenCalledWith('t1', { fix_retries: 2 });
    });
  });

  describe('isDone', () => {
    it('returns true if stage is done', () => {
      state.readState.mockReturnValue({ stage: 'done' });
      expect(orchestrator.isDone('t1')).toBe(true);
    });
  });

  describe('progress', () => {
    it('returns null if no state', () => {
      state.readState.mockReturnValue(null);
      expect(orchestrator.progress('t1')).toBeNull();
    });

    it('returns combined progress', () => {
      state.readState.mockReturnValue({ stage: 'team-verify', provider: 'claude', fix_retries: 1 });
      res.summarize.mockReturnValue({
        workers: 2, succeeded: 1, failed: 1, blocked: 0, tests_failed: 2, failing_workers: ['w2']
      });

      const p = orchestrator.progress('t1');
      expect(p.stage).toBe('team-verify');
      expect(p.workers).toBe(2);
      expect(p.failing_workers).toContain('w2');
      expect(p.fix_retries).toBe(1);
    });
  });
});
