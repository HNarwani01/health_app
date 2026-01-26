
import { MealPlan } from "../types";

export function generateICS(plan: MealPlan): string {
  let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//QuickChef//Pro//EN\n";

  plan.schedule.forEach(item => {
    // Basic date logic: assume plan starts "tomorrow"
    const date = new Date();
    date.setDate(date.getDate() + item.day);
    
    // Parse timeBlock (e.g. "Day 1 @ 18:00") or default to 9am
    let hour = 9;
    if (item.timeBlock.includes(':')) {
      const parts = item.timeBlock.split(':');
      const h = parseInt(parts[0].slice(-2));
      if (!isNaN(h)) hour = h;
    }
    
    date.setHours(hour, 0, 0, 0);
    const start = formatDate(date);
    
    date.setMinutes(date.getMinutes() + item.durationMinutes);
    const end = formatDate(date);

    ics += "BEGIN:VEVENT\n";
    ics += `SUMMARY:QuickChef: ${item.type.toUpperCase()} - ${item.description}\n`;
    ics += `DTSTART:${start}\n`;
    ics += `DTEND:${end}\n`;
    ics += `DESCRIPTION:${item.description}\n`;
    ics += "END:VEVENT\n";
  });

  ics += "END:VCALENDAR";
  return ics;
}

function formatDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}
