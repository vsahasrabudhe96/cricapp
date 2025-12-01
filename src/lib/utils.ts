/**
 * Utility functions used throughout the app
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with proper conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

/**
 * Format a time for display
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date and time together
 */
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

/**
 * Get relative time (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSecs = Math.round(diffMs / 1000);
  const diffMins = Math.round(diffSecs / 60);
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);

  if (Math.abs(diffSecs) < 60) {
    return diffSecs >= 0 ? 'just now' : 'just now';
  } else if (Math.abs(diffMins) < 60) {
    return diffMins > 0 ? `in ${diffMins}m` : `${Math.abs(diffMins)}m ago`;
  } else if (Math.abs(diffHours) < 24) {
    return diffHours > 0 ? `in ${diffHours}h` : `${Math.abs(diffHours)}h ago`;
  } else {
    return diffDays > 0 ? `in ${diffDays}d` : `${Math.abs(diffDays)}d ago`;
  }
}

/**
 * Format cricket score (e.g., "245/4")
 */
export function formatScore(runs: number, wickets: number): string {
  return `${runs}/${wickets}`;
}

/**
 * Format overs (e.g., "34.2")
 */
export function formatOvers(overs: number, balls: number): string {
  return `${overs}.${balls}`;
}

/**
 * Calculate run rate
 */
export function calculateRunRate(runs: number, overs: number, balls: number): number {
  const totalOvers = overs + balls / 6;
  if (totalOvers === 0) return 0;
  return Number((runs / totalOvers).toFixed(2));
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Sleep for a specified duration (useful for testing)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Check if a match is live
 */
export function isMatchLive(status: string): boolean {
  return ['LIVE', 'INNINGS_BREAK'].includes(status);
}

/**
 * Check if a match is upcoming
 */
export function isMatchUpcoming(status: string): boolean {
  return ['SCHEDULED', 'TOSS_DONE'].includes(status);
}

/**
 * Check if a match is completed
 */
export function isMatchCompleted(status: string): boolean {
  return ['COMPLETED', 'NO_RESULT', 'ABANDONED'].includes(status);
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'LIVE':
    case 'INNINGS_BREAK':
      return 'bg-red-500';
    case 'SCHEDULED':
    case 'TOSS_DONE':
      return 'bg-blue-500';
    case 'COMPLETED':
      return 'bg-green-500';
    case 'DELAYED':
    case 'STUMPS':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
}

/**
 * Format match format for display
 */
export function formatMatchFormat(format: string): string {
  const formats: Record<string, string> = {
    TEST: 'Test',
    ODI: 'ODI',
    T20I: 'T20I',
    T20: 'T20',
    LIST_A: 'List A',
    FIRST_CLASS: 'First Class',
  };
  return formats[format] || format;
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

