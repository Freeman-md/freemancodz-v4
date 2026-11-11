import { MEETING_CONFIG } from "./config";

const londonDate = new Intl.DateTimeFormat("sv-SE", {
  timeZone: MEETING_CONFIG.timezone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function getLondonDate(date: Date) {
  return londonDate.format(date);
}

export function resolveMeetingTime(date: string, time: string, timeZone: string): Date | null {
  let formatter: Intl.DateTimeFormat;

  try {
    formatter = new Intl.DateTimeFormat("sv-SE", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
  } catch {
    return null;
  }

  const wallTime = `${date} ${time}`;

  const wallTimeUtc = Date.parse(`${date}T${time}:00Z`);

  const day = 86_400_000;

  const matchingInstants = new Set<number>();

  // The offsets on either side of a transition distinguish skipped and repeated local times.
  for (const sample of [wallTimeUtc - day, wallTimeUtc, wallTimeUtc + day]) {
    const displayed = formatter.format(sample);

    const offset = Date.parse(`${displayed.replace(" ", "T")}:00Z`) - sample;

    const candidate = wallTimeUtc - offset;

    if (formatter.format(candidate) === wallTime) {
      matchingInstants.add(candidate);
    }
  }

  const [instant] = matchingInstants;

  return matchingInstants.size === 1 ? new Date(instant) : null;
}
