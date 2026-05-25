import {
  COMMUNITY_CONTRIBUTION_LEVELS,
  COMMUNITY_CONTRIBUTION_RULES,
  COMMUNITY_DEFAULT_CATEGORIES,
} from './community.types';

describe('community reputation and taxonomy', () => {
  it('keeps contribution rules focused on technical collaboration', () => {
    expect(COMMUNITY_CONTRIBUTION_RULES.CREATE_POST).toBe(5);
    expect(COMMUNITY_CONTRIBUTION_RULES.ANSWER_QUESTION).toBe(3);
    expect(COMMUNITY_CONTRIBUTION_RULES.USEFUL_ANSWER).toBe(15);
    expect(COMMUNITY_CONTRIBUTION_RULES.SHARE_ARTICLE).toBe(10);
    expect(COMMUNITY_CONTRIBUTION_RULES.THANKS).toBe(1);
    expect(COMMUNITY_CONTRIBUTION_RULES.SPAM).toBeLessThan(0);

    expect(COMMUNITY_CONTRIBUTION_RULES).not.toHaveProperty('PATIENT_VOLUME');
    expect(COMMUNITY_CONTRIBUTION_RULES).not.toHaveProperty('REVENUE');
  });

  it('keeps soft non-competitive levels ordered by minimum score', () => {
    const minScores = COMMUNITY_CONTRIBUTION_LEVELS.map(
      (level) => level.minScore,
    );
    const sortedScores = [...minScores].sort((a, b) => a - b);

    expect(minScores).toEqual(sortedScores);
    expect(COMMUNITY_CONTRIBUTION_LEVELS[0].name).toBe('Participante');
    expect(COMMUNITY_CONTRIBUTION_LEVELS.at(-1)?.name).toBe('Referencia SYNAP');
  });

  it('includes the initial clinical and scientific categories', () => {
    const slugs = COMMUNITY_DEFAULT_CATEGORIES.map(([slug]) => slug);

    expect(slugs).toContain('casos-clinicos');
    expect(slugs).toContain('discussao-de-laudos');
    expect(slugs).toContain('evidencias-cientificas');
    expect(slugs).toContain('ia-aplicada-a-saude');
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
