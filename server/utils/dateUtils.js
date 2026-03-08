/**
 * Calculate hours remaining until the event starts
 * @param {Object} event - The event object from DB
 * @returns {Number} - Hours remaining (can be negative if past)
 */
export const calculateHoursRemaining = (event) => {
  if (!event) return 0;
  
  try {
    let foundMonth = -1;
    let foundDay = -1;
    let foundYear = 2026; // Default to 2026

    // 1. Try to parse YYYY-MM format from event.month (new format)
    if (event.month && event.month.includes("-")) {
      const [y, m] = event.month.split("-");
      foundYear = parseInt(y);
      foundMonth = parseInt(m) - 1; // 0-indexed month
    } else {
      // Fallback to month names for legacy data
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthSource = (event.month || event.date || "").toString();
      months.forEach((m, i) => {
        if (monthSource.toLowerCase().includes(m.toLowerCase())) {
          foundMonth = i;
        }
      });
    }

    // 2. Try to find day from event.date
    if (event.date) {
      const dayMatch = event.date.toString().match(/\d+/);
      if (dayMatch) {
        foundDay = parseInt(dayMatch[0]);
      }
    }

    // 3. Fallback year parsing if not from YYYY-MM
    if (event.month && !event.month.includes("-")) {
      const yearMatch = (event.title || "").toString().match(/20\d{2}/);
      if (yearMatch) {
        foundYear = parseInt(yearMatch[0]);
      }
    }

    // 4. Construct the date
    if (foundMonth !== -1 && foundDay !== -1) {
      const timeStr = event.time ? String(event.time) : "00:00";
      const eventDateTime = new Date(foundYear, foundMonth, foundDay);

      // Apply time if format is HH:MM
      const timeParts = timeStr.match(/(\d{1,2}):(\d{2})/);
      if (timeParts) {
        eventDateTime.setHours(parseInt(timeParts[1]), parseInt(timeParts[2]), 0);
      }

      if (!isNaN(eventDateTime.getTime())) {
        const now = new Date();
        return (eventDateTime - now) / (1000 * 60 * 60);
      }
    }
  } catch (err) {
    console.error("Error calculating hours remaining:", err);
  }
  
  return 0;
};
