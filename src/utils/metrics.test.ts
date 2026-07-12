import { describe, test, expect } from 'vitest';
import { colorForDensity, riskScore, etaMinutes, canApprove } from './metrics';

describe('Metrics & RBAC Calculations', () => {
  describe('colorForDensity', () => {
    test('low density (< 45) returns green', () => {
      expect(colorForDensity(30)).toBe('#2FD675');
      expect(colorForDensity(0)).toBe('#2FD675');
    });

    test('moderate density (45 to 69) returns amber/orange', () => {
      expect(colorForDensity(45)).toBe('#FFB94D');
      expect(colorForDensity(69)).toBe('#FFB94D');
    });

    test('high density (>= 70) returns red', () => {
      expect(colorForDensity(70)).toBe('#FF5D5D');
      expect(colorForDensity(90)).toBe('#FF5D5D');
    });
  });

  describe('riskScore', () => {
    test('handles capacity <= 0 gracefully', () => {
      expect(riskScore(50, 20, 0)).toBe(0);
      expect(riskScore(50, 20, -10)).toBe(0);
    });

    test('calculates correct weighted index score', () => {
      // Density term: 90 * 0.7 = 63
      // Flow term: (80/100)*100 * 0.3 = 24
      // Total = 87
      expect(riskScore(90, 80, 100)).toBe(87);
    });

    test('caps terms to 100 before scaling', () => {
      // Density term: 120 (capped at 100) * 0.7 = 70
      // Flow term: 110 (capped at 100) * 0.3 = 30
      // Total = 100
      expect(riskScore(120, 110, 100)).toBe(100);
    });
  });

  describe('etaMinutes', () => {
    test('zero distance takes zero minutes', () => {
      expect(etaMinutes(0, 0)).toBe(0);
      expect(etaMinutes(0, 0.5)).toBe(0);
    });

    test('walk time increases with crowd density', () => {
      const normalTime = etaMinutes(100, 0);
      const crowdedTime = etaMinutes(100, 0.8);
      expect(crowdedTime).toBeGreaterThan(normalTime);
    });

    test('handles gridlock crowd speed limits', () => {
      // crowdFactor is clamped at max 0.9, so speed is 1.3 * (1 - 0.9) = 0.13 m/s
      // distance 78m / 0.13 m/s / 60s/min = 10 minutes
      expect(etaMinutes(78, 0.9)).toBe(10);
      expect(etaMinutes(78, 1.5)).toBe(10); // clamped at 0.9
    });
  });

  describe('canApprove permissions (RBAC)', () => {
    test('operations, security, and medical can approve all severities', () => {
      expect(canApprove('OPERATIONS', 'CRITICAL')).toBe(true);
      expect(canApprove('SECURITY', 'CRITICAL')).toBe(true);
      expect(canApprove('MEDICAL', 'CRITICAL')).toBe(true);
    });

    test('volunteer is always blocked from approvals', () => {
      expect(canApprove('VOLUNTEER', 'LOW')).toBe(false);
      expect(canApprove('VOLUNTEER', 'CRITICAL')).toBe(false);
    });

    test('eco is authorized for low/medium severity actions only', () => {
      expect(canApprove('ECO', 'LOW')).toBe(true);
      expect(canApprove('ECO', 'MEDIUM')).toBe(true);
      expect(canApprove('ECO', 'HIGH')).toBe(false);
      expect(canApprove('ECO', 'CRITICAL')).toBe(false);
    });

    test('handles case-insensitivity for roles and severities', () => {
      expect(canApprove('operations', 'critical')).toBe(true);
      expect(canApprove('security', 'high')).toBe(true);
      expect(canApprove('eco', 'low')).toBe(true);
      expect(canApprove('eco', 'critical')).toBe(false);
    });
  });
});
