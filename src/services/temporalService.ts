import { Temporal } from 'temporal-polyfill';

// Hard ZLA Limit: 14 Days
const ZLA_OFFLINE_LIMIT_DAYS = 14;

/**
 * Calculates the exact number of days between a past ISO timestamp and right now.
 * Uses Temporal.Instant to ensure absolute mathematical time, ignoring local device timezone tricks.
 */
export const calculateDaysOffline = (lastSyncIsoString: string | null): number => {
  if (!lastSyncIsoString) return 0;
  
  try {
    const lastSync = Temporal.Instant.from(lastSyncIsoString);
    const now = Temporal.Now.instant();
    
    // Calculate the exact duration in hours, then divide by 24 for strict 24-hour periods
    const duration = lastSync.until(now, { largestUnit: 'hours' });
    return Math.floor(duration.hours / 24);
  } catch (error) {
    console.error("Temporal API parsing error:", error);
    // Fail closed: If we can't verify time, assume maximum penalty for compliance safety
    return ZLA_OFFLINE_LIMIT_DAYS + 1; 
  }
};

/**
 * Evaluates if the current offline duration violates the Zoo License Act limits.
 */
export const evaluateZlaCompliance = (lastSyncIsoString: string | null) => {
  if (!lastSyncIsoString) return { isCompliant: true, daysRemaining: ZLA_OFFLINE_LIMIT_DAYS, daysOffline: 0 };

  const daysOffline = calculateDaysOffline(lastSyncIsoString);
  const daysRemaining = Math.max(0, ZLA_OFFLINE_LIMIT_DAYS - daysOffline);
  
  return {
    isCompliant: daysOffline <= ZLA_OFFLINE_LIMIT_DAYS,
    daysRemaining,
    daysOffline
  };
};

/**
 * Returns the current date in YYYY-MM-DD format strictly for the UK.
 */
export const getUKLocalDate = (): string => {
  return Temporal.Now.zonedDateTimeISO('Europe/London').toPlainDate().toString();
};

/**
 * Returns the current time in HH:MM format strictly for the UK.
 */
export const getUKLocalTime = (): string => {
  return Temporal.Now.zonedDateTimeISO('Europe/London').toPlainTime().toString({ smallestUnit: 'minute' });
};

/**
 * Takes a UTC ISO string from Supabase and converts it to a local UK time string (HH:MM), accounting for DST.
 */
export const formatToUKTime = (isoString: string): string => {
  if (!isoString) return '';
  try {
    const instant = Temporal.Instant.from(isoString);
    const zonedDateTime = instant.toZonedDateTimeISO('Europe/London');
    return zonedDateTime.toPlainTime().toString({ smallestUnit: 'minute' });
  } catch (error) {
    console.error("Error formatting to UK time:", error);
    return '';
  }
};
