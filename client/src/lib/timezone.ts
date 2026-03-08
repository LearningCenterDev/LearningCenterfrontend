import { format, parseISO } from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';

export interface TimezoneOption {
  value: string;
  label: string;
}

export const COMMON_TIMEZONES: TimezoneOption[] = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'America/Anchorage', label: 'Alaska' },
  { value: 'Pacific/Honolulu', label: 'Hawaii' },
  { value: 'Asia/Kathmandu', label: 'Nepal Time' },
  { value: 'Asia/Kolkata', label: 'India Standard Time' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time' },
  { value: 'Asia/Singapore', label: 'Singapore Time' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time' },
  { value: 'Asia/Shanghai', label: 'China Standard Time' },
  { value: 'Asia/Seoul', label: 'Korea Standard Time' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European Time' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)' },
  { value: 'Pacific/Auckland', label: 'New Zealand' },
];

export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

export function formatDateTimeInTimezone(
  utcDate: Date | string,
  timezone: string,
  formatStr: string = 'MMM d, yyyy h:mm a'
): string {
  const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  try {
    return formatInTimeZone(date, timezone, formatStr);
  } catch {
    return format(date, formatStr);
  }
}

export function formatTimeInTimezone(
  utcDate: Date | string,
  timezone: string,
  formatStr: string = 'h:mm a'
): string {
  return formatDateTimeInTimezone(utcDate, timezone, formatStr);
}

export function formatDateInTimezone(
  utcDate: Date | string,
  timezone: string,
  formatStr: string = 'MMM d, yyyy'
): string {
  return formatDateTimeInTimezone(utcDate, timezone, formatStr);
}

export function localToUTC(localDateTimeStr: string, timezone: string): Date {
  const localDate = parseISO(localDateTimeStr);
  return fromZonedTime(localDate, timezone);
}

export function utcToLocal(utcDate: Date | string, timezone: string): Date {
  const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  return toZonedTime(date, timezone);
}

export function getTimezoneOffset(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find(p => p.type === 'timeZoneName');
    return offsetPart?.value || '';
  } catch {
    return '';
  }
}

export function getTimezoneDisplayName(timezone: string): string {
  const found = COMMON_TIMEZONES.find(tz => tz.value === timezone);
  if (found) return found.label;
  
  const offset = getTimezoneOffset(timezone);
  return `${timezone} (${offset})`;
}

export function getUserTimezone(userTimezone?: string | null): string {
  if (userTimezone && userTimezone !== 'UTC') {
    return userTimezone;
  }
  return getBrowserTimezone();
}

export function isSameDayInTimezone(date1: Date | string, date2: Date, timezone: string): boolean {
  try {
    const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
    const d1Str = formatInTimeZone(d1, timezone, 'yyyy-MM-dd');
    const d2Str = formatInTimeZone(d2, timezone, 'yyyy-MM-dd');
    return d1Str === d2Str;
  } catch {
    const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
    return format(d1, 'yyyy-MM-dd') === format(date2, 'yyyy-MM-dd');
  }
}
