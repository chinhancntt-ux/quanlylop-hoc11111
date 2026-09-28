/**
 * Date and Time utilities for classroom application
 */

export interface FormattedDateTime {
  time: string;      // e.g. "14:30"
  date: string;      // e.g. "15/09/2026"
  full: string;      // e.g. "14:30 - 15/09/2026"
  detailed: string;  // e.g. "Ngày 15 tháng 09 năm 2026, lúc 14:30"
}

/**
 * Parses any date input (ISO string, timestamp, Date object, or legacy string)
 * and returns full Day, Month, Year, and Hours:Minutes formatted string.
 */
export function formatFullDateTime(
  dateInput?: string | Date | number,
  fallbackFormatted?: string
): FormattedDateTime {
  if (dateInput) {
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) {
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();

      return {
        time: `${hours}:${minutes}`,
        date: `${day}/${month}/${year}`,
        full: `${hours}:${minutes} - ${day}/${month}/${year}`,
        detailed: `Ngày ${day} tháng ${month} năm ${year}, lúc ${hours}:${minutes}`,
      };
    }
  }

  // If fallback text provided (e.g. legacy format)
  if (fallbackFormatted) {
    // If it already has DD/MM/YYYY
    const dateMatch = fallbackFormatted.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    const timeMatch = fallbackFormatted.match(/(\d{1,2}:\d{2})/);

    if (dateMatch && timeMatch) {
      return {
        time: timeMatch[1],
        date: dateMatch[1],
        full: `${timeMatch[1]} - ${dateMatch[1]}`,
        detailed: `Ngày ${dateMatch[1]}, lúc ${timeMatch[1]}`,
      };
    }

    // If it contains "Hôm nay, HH:mm" or "Hôm qua, HH:mm"
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const timeStr = timeMatch ? timeMatch[1] : `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    return {
      time: timeStr,
      date: `${day}/${month}/${year}`,
      full: `${timeStr} - ${day}/${month}/${year}`,
      detailed: `Ngày ${day} tháng ${month} năm ${year}, lúc ${timeStr}`,
    };
  }

  // Default to current date and time
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  return {
    time: `${hours}:${minutes}`,
    date: `${day}/${month}/${year}`,
    full: `${hours}:${minutes} - ${day}/${month}/${year}`,
    detailed: `Ngày ${day} tháng ${month} năm ${year}, lúc ${hours}:${minutes}`,
  };
}
