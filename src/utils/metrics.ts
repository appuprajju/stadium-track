/**
 * Utility functions for StadiumMind AI calculations and RBAC assertions.
 */

export function colorForDensity(pct: number): string {
  if (pct < 45) return '#2FD675';
  if (pct < 70) return '#FFB94D';
  return '#FF5D5D';
}

export function riskScore(densityPct: number, inflowRate: number, capacity: number): number {
  if (capacity <= 0) return 0;
  const densityTerm = Math.min(100, densityPct) * 0.7;
  const flowTerm = Math.min(100, (inflowRate / capacity) * 100) * 0.3;
  return Math.round(densityTerm + flowTerm);
}

export function etaMinutes(distanceMeters: number, crowdFactor: number): number {
  const clamped = Math.max(0, Math.min(0.9, crowdFactor));
  const speed = 1.3 * (1 - clamped);
  if (speed <= 0) return Infinity;
  return parseFloat((distanceMeters / speed / 60).toFixed(1));
}

export function canApprove(role: string, severity: string): boolean {
  if (role === 'OPERATIONS' || role === 'SECURITY') return true;
  if (role === 'ECO' && severity !== 'CRITICAL' && severity !== 'HIGH') return true;
  return false;
}
