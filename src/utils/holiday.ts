
/**
 * Checks if a given date is a weekend (Saturday or Sunday) or a Korean public holiday.
 * Includes substitute holidays for 2026 as requested.
 */
export const isWeekendOrHoliday = (date: Date): boolean => {
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6; // 0: Sunday, 6: Saturday
  if (isWeekend) return true;

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const dayOfMonth = date.getDate();
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`;

  // List of Korean Public Holidays for 2025-2026 (Simplified for common ones + requested 2026-03-02)
  const holidays = [
    // 2025
    '2025-01-01', // New Year
    '2025-01-28', '2025-01-29', '2025-01-30', // Seollal
    '2025-03-01', '2025-03-03', // Independence Movement Day + Substitute
    '2025-05-05', // Children's Day + Buddha's Birthday
    '2025-06-06', // Memorial Day
    '2025-08-15', // Liberation Day
    '2025-10-03', // National Foundation Day
    '2025-10-05', '2025-10-06', '2025-10-07', '2025-10-08', // Chuseok + Substitute
    '2025-10-09', // Hangeul Day
    '2025-12-25', // Christmas
    
    // 2026
    '2026-01-01', // New Year
    '2026-02-16', '2026-02-17', '2026-02-18', // Seollal
    '2026-03-01', 
    '2026-03-02', // Independence Movement Day Substitute (Requested)
    '2026-05-05', // Children's Day
    '2026-05-24', '2026-05-25', // Buddha's Birthday + Substitute
    '2026-06-06', '2026-06-08', // Memorial Day + Substitute
    '2026-08-15', '2026-08-17', // Liberation Day + Substitute
    '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-28', // Chuseok + Substitute
    '2026-10-03', '2026-10-05', // National Foundation Day + Substitute
    '2026-10-09', // Hangeul Day
    '2026-12-25', // Christmas
  ];

  return holidays.includes(dateStr);
};
