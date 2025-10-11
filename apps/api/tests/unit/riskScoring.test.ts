import { describe, it, expect, beforeEach } from '@jest/globals';

// Test fixtures for risk scoring
const mockClauses = [
  {
    id: 'clause-1',
    type: 'termination',
    text: 'Either party may terminate this agreement with 30 days notice',
    riskScore: null
  },
  {
    id: 'clause-2',
    type: 'liability',
    text: 'Company shall not be liable for any indirect, incidental, or consequential damages',
    riskScore: null
  },
  {
    id: 'clause-3',
    type: 'payment',
    text: 'Payment is due within 15 days of invoice receipt',
    riskScore: null
  },
  {
    id: 'clause-4',
    type: 'confidentiality',
    text: 'All confidential information must be protected for a period of 5 years',
    riskScore: null
  },
  {
    id: 'clause-5',
    type: 'force_majeure',
    text: 'Neither party shall be liable for delays due to circumstances beyond their control',
    riskScore: null
  }
];

const mockRiskPatterns = {
  termination: {
    keywords: ['terminate', 'termination', 'end', 'cancel'],
    riskWeight: 0.7,
    severity: 'medium'
  },
  liability: {
    keywords: ['liable', 'liability', 'damages', 'indemnify'],
    riskWeight: 0.9,
    severity: 'high'
  },
  payment: {
    keywords: ['payment', 'due', 'invoice', 'penalty'],
    riskWeight: 0.5,
    severity: 'low'
  },
  confidentiality: {
    keywords: ['confidential', 'proprietary', 'secret', 'non-disclosure'],
    riskWeight: 0.6,
    severity: 'medium'
  },
  force_majeure: {
    keywords: ['force majeure', 'act of god', 'beyond control'],
    riskWeight: 0.3,
    severity: 'low'
  }
};

// Mock risk scoring functions
function calculateRiskScore(clause: any, patterns: any): number {
  const pattern = patterns[clause.type];
  if (!pattern) return 0.1; // Default low risk for unknown types

  const text = clause.text.toLowerCase();
  const keywordMatches = pattern.keywords.filter((keyword: string) => 
    text.includes(keyword.toLowerCase())
  ).length;

  const baseScore = pattern.riskWeight;
  const keywordMultiplier = Math.min(1 + (keywordMatches * 0.1), 1.5);
  
  return Math.min(baseScore * keywordMultiplier, 1.0);
}

function categorizeRisk(score: number): string {
  if (score >= 0.8) return 'critical';
  if (score >= 0.6) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}

function calculateOverallRiskScore(clauses: any[]): {
  overallScore: number;
  riskDistribution: Record<string, number>;
  criticalClauses: any[];
} {
  const scoredClauses = clauses.map(clause => ({
    ...clause,
    riskScore: calculateRiskScore(clause, mockRiskPatterns),
    riskCategory: categorizeRisk(calculateRiskScore(clause, mockRiskPatterns))
  }));

  const overallScore = scoredClauses.reduce((sum, clause) => sum + clause.riskScore, 0) / scoredClauses.length;
  
  const riskDistribution = scoredClauses.reduce((dist, clause) => {
    dist[clause.riskCategory] = (dist[clause.riskCategory] || 0) + 1;
    return dist;
  }, {} as Record<string, number>);

  const criticalClauses = scoredClauses.filter(clause => clause.riskCategory === 'critical');

  return {
    overallScore,
    riskDistribution,
    criticalClauses
  };
}

describe('Risk Scoring Logic', () => {
  beforeEach(() => {
    // Reset any mocks or state
  });

  describe('calculateRiskScore', () => {
    it('should calculate high risk score for liability clauses', () => {
      const liabilityClause = mockClauses.find(c => c.type === 'liability')!;
      const score = calculateRiskScore(liabilityClause, mockRiskPatterns);
      
      expect(score).toBeGreaterThan(0.8);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('should calculate medium risk score for termination clauses', () => {
      const terminationClause = mockClauses.find(c => c.type === 'termination')!;
      const score = calculateRiskScore(terminationClause, mockRiskPatterns);
      
      expect(score).toBeGreaterThan(0.6);
      expect(score).toBeLessThanOrEqual(0.8);
    });

    it('should calculate low risk score for payment clauses', () => {
      const paymentClause = mockClauses.find(c => c.type === 'payment')!;
      const score = calculateRiskScore(paymentClause, mockRiskPatterns);
      
      expect(score).toBeGreaterThan(0.4);
      expect(score).toBeLessThanOrEqual(0.6);
    });

    it('should return default score for unknown clause types', () => {
      const unknownClause = { id: 'unknown', type: 'unknown', text: 'Some text' };
      const score = calculateRiskScore(unknownClause, mockRiskPatterns);
      
      expect(score).toBe(0.1);
    });

    it('should increase score based on keyword matches', () => {
      const clauseWithMultipleKeywords = {
        id: 'test',
        type: 'liability',
        text: 'Company shall be liable for damages and indemnify against all liability'
      };
      const score = calculateRiskScore(clauseWithMultipleKeywords, mockRiskPatterns);
      
      expect(score).toBeGreaterThan(0.9);
    });
  });

  describe('categorizeRisk', () => {
    it('should categorize scores correctly', () => {
      expect(categorizeRisk(0.9)).toBe('critical');
      expect(categorizeRisk(0.7)).toBe('high');
      expect(categorizeRisk(0.5)).toBe('medium');
      expect(categorizeRisk(0.3)).toBe('low');
    });

    it('should handle edge cases', () => {
      expect(categorizeRisk(0.8)).toBe('critical');
      expect(categorizeRisk(0.6)).toBe('high');
      expect(categorizeRisk(0.4)).toBe('medium');
      expect(categorizeRisk(0.0)).toBe('low');
    });
  });

  describe('calculateOverallRiskScore', () => {
    it('should calculate overall risk score for all clauses', () => {
      const result = calculateOverallRiskScore(mockClauses);
      
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.overallScore).toBeLessThanOrEqual(1);
      expect(result.riskDistribution).toBeDefined();
      expect(result.criticalClauses).toBeDefined();
    });

    it('should provide correct risk distribution', () => {
      const result = calculateOverallRiskScore(mockClauses);
      
      const totalClauses = Object.values(result.riskDistribution).reduce((sum, count) => sum + count, 0);
      expect(totalClauses).toBe(mockClauses.length);
    });

    it('should identify critical clauses', () => {
      const result = calculateOverallRiskScore(mockClauses);
      
      result.criticalClauses.forEach(clause => {
        expect(clause.riskScore).toBeGreaterThanOrEqual(0.8);
        expect(clause.riskCategory).toBe('critical');
      });
    });

    it('should handle empty clause list', () => {
      const result = calculateOverallRiskScore([]);
      
      expect(result.overallScore).toBeNaN();
      expect(result.riskDistribution).toEqual({});
      expect(result.criticalClauses).toEqual([]);
    });
  });

  describe('Risk Scoring Edge Cases', () => {
    it('should handle clauses with no matching keywords', () => {
      const clauseWithoutKeywords = {
        id: 'no-keywords',
        type: 'liability',
        text: 'This clause has no risk keywords at all'
      };
      const score = calculateRiskScore(clauseWithoutKeywords, mockRiskPatterns);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(0.9);
    });

    it('should handle very long clauses', () => {
      const longClause = {
        id: 'long-clause',
        type: 'liability',
        text: 'This is a very long clause that contains many words and should still be processed correctly for risk assessment. It includes liability terms and damage clauses that should increase the risk score appropriately.'
      };
      const score = calculateRiskScore(longClause, mockRiskPatterns);
      
      expect(score).toBeGreaterThan(0.8);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('should handle clauses with special characters', () => {
      const specialCharClause = {
        id: 'special-chars',
        type: 'payment',
        text: 'Payment is due within 15 days! @#$%^&*()_+{}|:"<>?[]\\;\',./'
      };
      const score = calculateRiskScore(specialCharClause, mockRiskPatterns);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Risk Pattern Matching', () => {
    it('should match keywords case-insensitively', () => {
      const mixedCaseClause = {
        id: 'mixed-case',
        type: 'liability',
        text: 'COMPANY shall be LIABLE for DAMAGES'
      };
      const score = calculateRiskScore(mixedCaseClause, mockRiskPatterns);
      
      expect(score).toBeGreaterThan(0.8);
    });

    it('should handle partial keyword matches', () => {
      const partialMatchClause = {
        id: 'partial-match',
        type: 'termination',
        text: 'This agreement may be terminated by either party'
      };
      const score = calculateRiskScore(partialMatchClause, mockRiskPatterns);
      
      expect(score).toBeGreaterThan(0.6);
    });
  });
});
