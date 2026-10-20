import { DEFAULT_SCENARIOS } from './default-scenarios';

describe('Frontend Default Scenarios & Types', () => {
  it('should have 5 preloaded reproducible scenarios', () => {
    expect(DEFAULT_SCENARIOS.length).toBe(5);
  });

  it('should include financial scenario with SEC 10-K evidence', () => {
    const fin = DEFAULT_SCENARIOS.find((s) => s.id === 'financial-10k-conflict');
    expect(fin).toBeDefined();
    expect(fin?.payload.evidenceDocuments.length).toBeGreaterThan(0);
    expect(fin?.payload.candidates.length).toBe(2);
  });

  it('should include missing evidence scenario with empty evidence array', () => {
    const missing = DEFAULT_SCENARIOS.find((s) => s.id === 'synthetic-consensus-missing-evidence');
    expect(missing).toBeDefined();
    expect(missing?.payload.evidenceDocuments.length).toBe(0);
    expect(missing?.payload.candidates.length).toBeGreaterThanOrEqual(2);
  });
});
