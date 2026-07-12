/**
 * Utility functions for StadiumMind AI calculations and RBAC assertions.
 */

export function colorForDensity(pct: number): string {
  const value = Math.max(0, pct);
  if (value < 45) return '#2FD675';
  if (value < 70) return '#FFB94D';
  return '#FF5D5D';
}

export function riskScore(densityPct: number, inflowRate: number, capacity: number): number {
  if (capacity <= 0) return 0;
  const densityVal = Math.max(0, Math.min(100, densityPct));
  const inflowVal = Math.max(0, inflowRate);
  const densityTerm = densityVal * 0.7;
  const flowTerm = Math.min(100, (inflowVal / capacity) * 100) * 0.3;
  return Math.round(densityTerm + flowTerm);
}

export function etaMinutes(distanceMeters: number, crowdFactor: number): number {
  const clampedDist = Math.max(0, distanceMeters);
  const clampedCrowd = Math.max(0, Math.min(0.9, crowdFactor));
  const speed = 1.3 * (1 - clampedCrowd);
  if (speed <= 0) return Infinity;
  return parseFloat((clampedDist / speed / 60).toFixed(1));
}

export function canApprove(role: string, severity: string): boolean {
  const normRole = (role || '').toUpperCase();
  const normSeverity = (severity || '').toUpperCase();
  if (normRole === 'OPERATIONS' || normRole === 'SECURITY' || normRole === 'MEDICAL') return true;
  if (normRole === 'ECO' && normSeverity !== 'CRITICAL' && normSeverity !== 'HIGH') return true;
  return false;
}
