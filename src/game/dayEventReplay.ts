import { applyGameDayEvent, emptyGameDay, type DayEvent, type GameDay } from './dayEventProjection';

/**
 * Deterministic game-only replay. Rejected events are returned for diagnostics,
 * never silently treated as successful customer/staff actions.
 * No Café OS imports or persistence side effects.
 */
export function replayGameDay(events: readonly DayEvent[]): {
  day: GameDay;
  acceptedEventIds: string[];
  rejectedEventIds: string[];
} {
  let day = emptyGameDay();
  const acceptedEventIds: string[] = [];
  const rejectedEventIds: string[] = [];
  for (const event of events) {
    const next = applyGameDayEvent(day, event);
    if (next === day) rejectedEventIds.push(event.id);
    else {
      acceptedEventIds.push(event.id);
      day = next;
    }
  }
  return { day, acceptedEventIds, rejectedEventIds };
}
