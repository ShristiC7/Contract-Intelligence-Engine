import { describe, it, expect } from '@jest/globals';

// Test fixtures for risk scoring
const testClauses = [
  {
    type: 'termination',
    text: 'Either party may terminate this agreement with 30 days notice.',
    expectedRiskScore: 3.5
  },
  {
    type: 'liability',
    text: 'The company\'s liability shall not exceed the contract value.',
    expectedRiskScore: 4.2
  },
  {
    type: 'payment',
    text: 'Payment shall be made within 30 days of invoice receipt.',
    expectedRiskScore: 2.1
  },
  {
    type: 'force_majeure',
    text: 'Neither party shall be liable for delays due to circumstances beyond their control.',
    expectedRiskScore: 3.8
  },
  {
    type: 'indemnification',
    text: 'Party A shall indemnify and hold harmless Party B from all claims, damages, and expenses.',
    expectedRiskScore: 7.5
  },
  {
    type: 'confidentiality',
    text: 'All information shared shall remain confidential for a period of 5 years.',
    expectedRiskScore: 4.0
  },
  {
    type: 'intellectual_property',
    text: 'All intellectual property developed under this agreement shall belong to Party A.',
    expectedRiskScore: 6.2
  },
  {
    type: 'governing_law',
    text: 'This agreement shall be governed by the laws of the State of California.',
    expectedRiskScore: 2.5
  }
];

const highRiskClauses = [
  {
    type: 'penalty',
    text: 'Failure to deliver on time shall result in a penalty of $10,000 per day.',
    expectedRiskScore: 8.5
  },
  {
    type: 'exclusive',
    text: 'Party B shall not work with any competitors for a period of 2 years.',
    expectedRiskScore: 7.8
  },
  {
    type: 'liquidated_damages',
    text: 'Liquidated damages shall be calculated as 150% of the contract value.',
    expectedRiskScore: 9.2
  }
];

const lowRiskClauses = [
  {
    type: 'warranty',
    text: 'The product is warranted against defects for 1 year from delivery.',
    expectedRiskScore: 1.5
  },
  {
    type: 'support',
    text: 'Technical support will be provided during business hours.',
    expectedRiskScore: 1.0
  }
];

describe('Risk Scoring Logic', () => {
  // Mock risk scoring function
  const calculateRiskScore = (clause: { type: string; text: string }): number => {
    const baseScores: Record<string, number> = {
      termination: 3.5,
      liability: 4.2,
      payment: 2.1,
      force_majeure: 3.8,
      indemnification: 7.5,
      confidentiality: 4.0,
      intellectual_property: 6.2,
      governing_law: 2.5,
      penalty: 8.5,
      exclusive: 7.8,
      liquidated_damages: 9.2,
      warranty: 1.5,
      support: 1.0
    };

    let score = baseScores[clause.type] || 5.0;

    // Adjust based on text content
    const text = clause.text.toLowerCase();
    
    // High-risk keywords
    if (text.includes('penalty') || text.includes('fine')) score += 1.0;
    if (text.includes('exclusive') || text.includes('non-compete')) score += 1.5;
    if (text.includes('liquidated damages')) score += 2.0;
    if (text.includes('indemnify') || text.includes('hold harmless')) score += 1.0;
    if (text.includes('unlimited') || text.includes('all claims')) score += 1.5;
    
    // Time-based adjustments
    if (text.includes('years') || text.includes('months')) {
      const timeMatch = text.match(/(\d+)\s*(year|month)/);
      if (timeMatch) {
        const duration = parseInt(timeMatch[1]);
        const unit = timeMatch[2];
        if (unit === 'year' && duration > 1) score += 0.5;
        if (unit === 'month' && duration > 12) score += 0.3;
      }
    }

    // Amount-based adjustments
    if (text.includes('$')) {
      const amountMatch = text.match(/\$([\d,]+)/);
      if (amountMatch) {
        const amount = parseInt(amountMatch[1].replace(/,/g, ''));
        if (amount > 10000) score += 1.0;
        if (amount > 100000) score += 1.5;
      }
    }

    // Percentage-based adjustments
    if (text.includes('%')) {
      const percentMatch = text.match(/(\d+)%/);
      if (percentMatch) {
        const percent = parseInt(percentMatch[1]);
        if (percent > 100) score += 1.0;
        if (percent > 150) score += 2.0;
      }
    }

    return Math.min(Math.max(score, 0), 10); // Clamp between 0 and 10
  };

  describe('Standard Risk Scoring', () => {
    testClauses.forEach((clause, index) => {
      it(`should calculate correct risk score for ${clause.type} clause`, () => {
        const score = calculateRiskScore(clause);
        expect(score).toBeCloseTo(clause.expectedRiskScore, 1);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('High Risk Clauses', () => {
    highRiskClauses.forEach((clause, index) => {
      it(`should identify high risk for ${clause.type} clause`, () => {
        const score = calculateRiskScore(clause);
        expect(score).toBeGreaterThan(7.0);
        expect(score).toBeCloseTo(clause.expectedRiskScore, 1);
      });
    });
  });

  describe('Low Risk Clauses', () => {
    lowRiskClauses.forEach((clause, index) => {
      it(`should identify low risk for ${clause.type} clause`, () => {
        const score = calculateRiskScore(clause);
        expect(score).toBeLessThan(3.0);
        expect(score).toBeCloseTo(clause.expectedRiskScore, 1);
      });
    });
  });

  describe('Risk Score Aggregation', () => {
    it('should calculate overall contract risk score', () => {
      const allClauses = [...testClauses, ...highRiskClauses, ...lowRiskClauses];
      const scores = allClauses.map(clause => calculateRiskScore(clause));
      
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const maxScore = Math.max(...scores);
      const minScore = Math.min(...scores);
      
      expect(averageScore).toBeGreaterThan(0);
      expect(averageScore).toBeLessThan(10);
      expect(maxScore).toBeGreaterThan(7.0);
      expect(minScore).toBeLessThan(3.0);
    });

    it('should weight high-risk clauses more heavily', () => {
      const highRiskScore = calculateRiskScore(highRiskClauses[0]);
      const lowRiskScore = calculateRiskScore(lowRiskClauses[0]);
      
      expect(highRiskScore).toBeGreaterThan(lowRiskScore * 2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle unknown clause types', () => {
      const unknownClause = {
        type: 'unknown_type',
        text: 'This is an unknown clause type.'
      };
      
      const score = calculateRiskScore(unknownClause);
      expect(score).toBe(5.0); // Default score
    });

    it('should handle empty text', () => {
      const emptyClause = {
        type: 'termination',
        text: ''
      };
      
      const score = calculateRiskScore(emptyClause);
      expect(score).toBe(3.5); // Base score only
    });

    it('should clamp scores to valid range', () => {
      const extremeClause = {
        type: 'penalty',
        text: 'Penalty of $1,000,000 per day for unlimited years with 500% liquidated damages and unlimited indemnification.'
      };
      
      const score = calculateRiskScore(extremeClause);
      expect(score).toBeLessThanOrEqual(10);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Risk Categories', () => {
    it('should categorize risk levels correctly', () => {
      const categorizeRisk = (score: number): string => {
        if (score >= 8.0) return 'CRITICAL';
        if (score >= 6.0) return 'HIGH';
        if (score >= 4.0) return 'MEDIUM';
        if (score >= 2.0) return 'LOW';
        return 'MINIMAL';
      };

      expect(categorizeRisk(9.2)).toBe('CRITICAL');
      expect(categorizeRisk(7.5)).toBe('HIGH');
      expect(categorizeRisk(5.0)).toBe('MEDIUM');
      expect(categorizeRisk(3.0)).toBe('LOW');
      expect(categorizeRisk(1.0)).toBe('MINIMAL');
    });

    it('should provide risk recommendations', () => {
      const getRiskRecommendation = (score: number): string => {
        if (score >= 8.0) return 'Immediate legal review required';
        if (score >= 6.0) return 'Legal review recommended';
        if (score >= 4.0) return 'Consider legal consultation';
        if (score >= 2.0) return 'Standard review';
        return 'Low risk - proceed';
      };

      expect(getRiskRecommendation(9.2)).toBe('Immediate legal review required');
      expect(getRiskRecommendation(7.5)).toBe('Legal review recommended');
      expect(getRiskRecommendation(5.0)).toBe('Consider legal consultation');
      expect(getRiskRecommendation(3.0)).toBe('Standard review');
      expect(getRiskRecommendation(1.0)).toBe('Low risk - proceed');
    });
  });
});
