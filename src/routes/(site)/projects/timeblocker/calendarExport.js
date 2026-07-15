/**
 * Export scheduled tasks to iCal format (compatible with Google Calendar and Apple Calendar)
 * @param {Array<any>} scheduledTasks - Array of scheduled tasks with task info and block info
 * @param {Date} date - The date for which tasks are scheduled (defaults to today)
 * @param {Array<string>} weekendDays - Array of weekend day names (e.g., ['Saturday', 'Sunday'])
 * @returns {string} iCal formatted string
 */
export function exportToICal(scheduledTasks, date = new Date(), weekendDays = []) {
  // Get the date in YYYYMMDD format
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // Generate a unique calendar ID
  const calendarId = `timeblocker-${Date.now()}@jassim.in`;

  // Start building the iCal content
  let ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TimeBlocker//TimeBlocker Calendar Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ''
  ].join('\r\n');

  // Add each scheduled task as a calendar event
  scheduledTasks.forEach((task) => {
    if (task.startHour === undefined || task.startHour === null) return; // Skip invalid entries

    // Convert startHour (decimal hours) to hours and minutes
    const startHour = Math.floor(task.startHour);
    const startMinute = Math.round((task.startHour - startHour) * 60);
    
    // Convert duration (hours) to minutes
    const durationMinutes = Math.round(task.duration * 60);
    
    // Create start and end times using the provided date
    const startDate = new Date(date);
    startDate.setHours(startHour, startMinute, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + durationMinutes);

    // Format dates in iCal format: YYYYMMDDTHHMMSS (local time, no Z suffix for floating time)
    const formatDate = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const h = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      const s = String(d.getSeconds()).padStart(2, '0');
      return `${y}${m}${day}T${h}${min}${s}`;
    };

    const dtstart = formatDate(startDate);
    const dtend = formatDate(endDate);
    const dtstamp = formatDate(new Date());

    // Escape text for iCal format (escape commas, semicolons, backslashes, newlines)
    const escapeText = (text) => {
      if (!text) return '';
      return String(text)
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '');
    };

    const summary = escapeText(task.name || 'Untitled Task');
    const description = escapeText(
      `Task: ${task.name || 'Untitled Task'}\n` +
      `Duration: ${durationMinutes} minutes\n` +
      (task.preference ? `Preferred time: ${task.preference}\n` : '') +
      (task.category ? `Category: ${task.category}` : '')
    );

    // Generate unique event ID
    const uid = `${task.id || Date.now()}-${task.startHour}@timeblocker.jassim.in`;

    // Determine recurrence rule based on task type
    let rrule = 'RRULE:FREQ=DAILY';
    
    // If it's a work task and weekend days are specified, exclude weekends
    if (task.color === 'work' && weekendDays.length > 0) {
      // Map day names to iCal day abbreviations
      const dayMap = {
        'Monday': 'MO',
        'Tuesday': 'TU',
        'Wednesday': 'WE',
        'Thursday': 'TH',
        'Friday': 'FR',
        'Saturday': 'SA',
        'Sunday': 'SU'
      };
      
      // Get all days of the week
      const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      // Filter out weekend days to get weekdays
      const weekdays = allDays.filter(day => !weekendDays.includes(day));
      
      // Convert to iCal format
      const weekdayAbbrs = weekdays.map(day => dayMap[day]).join(',');
      
      if (weekdayAbbrs) {
        rrule = `RRULE:FREQ=DAILY;BYDAY=${weekdayAbbrs}`;
      }
    }

    // Build the event with appropriate recurrence
    const event = [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      rrule,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT'
    ].join('\r\n');

    ical += event + '\r\n';
  });

  // Close the calendar
  ical += '\r\nEND:VCALENDAR';

  return ical;
}

/**
 * Download iCal file
 * @param {string} icalContent - The iCal formatted string
 * @param {string} filename - The filename for the download (defaults to timeblocker-calendar.ics)
 */
export function downloadICalFile(icalContent, filename = 'timeblocker-calendar.ics') {
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export scheduled tasks to calendar
 * @param {Array<any>} scheduledTasks - Array of scheduled tasks
 * @param {Date} date - The date for which tasks are scheduled
 * @param {Array<string>} weekendDays - Array of weekend day names (e.g., ['Saturday', 'Sunday'])
 */
export function exportToCalendar(scheduledTasks, date = new Date(), weekendDays = []) {
  if (!scheduledTasks || scheduledTasks.length === 0) {
    throw new Error('No scheduled tasks to export');
  }

  const icalContent = exportToICal(scheduledTasks, date, weekendDays);
  const dateStr = date.toISOString().split('T')[0];
  const filename = `timeblocker-calendar-${dateStr}.ics`;
  downloadICalFile(icalContent, filename);
}
