import { FlightRecord } from '../types';

/**
 * SYNTHETIC DEMONSTRATION DATASET (7-DAY SAMPLE NETWORK)
 * All flight IDs, airlines, schedules, and delays in this file are simulated
 * benchmark records created for business operations modeling across 7 consecutive days.
 * This does not connect to live airline telemetry feeds.
 */

interface RouteTemplate {
  prefix: string;
  airline: string;
  origin: string;
  destination: string;
  distance: number;
  aircraft_type: string;
  capacity: number;
  baseHour: number;
  baseMinute: number;
}

const ROUTE_TEMPLATES: RouteTemplate[] = [
  // SkyStream Airlines (20 routes)
  { prefix: 'SK', airline: 'SkyStream Airlines', origin: 'JFK', destination: 'LHR', distance: 3451, aircraft_type: 'B787-9', capacity: 280, baseHour: 8, baseMinute: 0 },
  { prefix: 'SK', airline: 'SkyStream Airlines', origin: 'LHR', destination: 'JFK', distance: 3451, aircraft_type: 'B787-9', capacity: 280, baseHour: 11, baseMinute: 30 },
  { prefix: 'SK', airline: 'SkyStream Airlines', origin: 'SFO', destination: 'ORD', distance: 1846, aircraft_type: 'A321neo', capacity: 196, baseHour: 6, baseMinute: 15 },
  { prefix: 'SK', airline: 'SkyStream Airlines', origin: 'ORD', destination: 'SFO', distance: 1846, aircraft_type: 'A321neo', capacity: 196, baseHour: 13, baseMinute: 0 },
  { prefix: 'SK', airline: 'SkyStream Airlines', origin: 'LAX', destination: 'HND', distance: 5487, aircraft_type: 'A350-900', capacity: 325, baseHour: 12, baseMinute: 40 },
  { prefix: 'SK', airline: 'SkyStream Airlines', origin: 'HND', destination: 'LAX', distance: 5487, aircraft_type: 'A350-900', capacity: 325, baseHour: 17, baseMinute: 20 },
  { prefix: 'SK', airline: 'SkyStream Airlines', origin: 'DXB', destination: 'CDG', distance: 3260, aircraft_type: 'B777-300ER', capacity: 340, baseHour: 8, baseMinute: 30 },
  { prefix: 'SK', airline: 'SkyStream Airlines', origin: 'CDG', destination: 'DXB', distance: 3260, aircraft_type: 'B777-300ER', capacity: 340, baseHour: 15, baseMinute: 10 },
  { prefix: 'SK', airline: 'SkyStream Airlines', origin: 'JFK', destination: 'MCO', distance: 944, aircraft_type: 'A321neo', capacity: 196, baseHour: 6, baseMinute: 45 },
  { prefix: 'SK', airline: 'SkyStream Airlines', origin: 'MCO', destination: 'JFK', distance: 944, aircraft_type: 'A321neo', capacity: 196, baseHour: 10, baseMinute: 30 },
  { prefix: 'SK', airline: 'SkyStream Airlines', origin: 'LAX', destination: 'SFO', distance: 337, aircraft_type: 'B737-800', capacity: 162, baseHour: 6, baseMinute: 0 },
  { prefix: 'SK', airline: 'SkyStream Airlines', origin: 'SFO', destination: 'LAX', distance: 337, aircraft_type: 'B737-800', capacity: 162, baseHour: 8, baseMinute: 30 },
  { prefix: 'SK', airline: 'SkyStream Airlines', origin: 'DFW', destination: 'LAX', distance: 1235, aircraft_type: 'A321neo', capacity: 196, baseHour: 9, baseMinute: 0 },
  { prefix: 'SK', airline: 'SkyStream Airlines', origin: 'LAX', destination: 'DFW', distance: 1235, aircraft_type: 'A321neo', capacity: 196, baseHour: 12, baseMinute: 30 },
  { prefix: 'SK', airline: 'SkyStream Airlines', origin: 'MCO', destination: 'ORD', distance: 1005, aircraft_type: 'B737-MAX8', capacity: 178, baseHour: 13, baseMinute: 10 },
  { prefix: 'SK', airline: 'SkyStream Airlines', origin: 'ORD', destination: 'MCO', distance: 1005, aircraft_type: 'B737-MAX8', capacity: 178, baseHour: 16, baseMinute: 45 },
  { prefix: 'SK', airline: 'SkyStream Airlines', origin: 'SFO', destination: 'JFK', distance: 2586, aircraft_type: 'B787-9', capacity: 280, baseHour: 7, baseMinute: 30 },
  { prefix: 'SK', airline: 'SkyStream Airlines', origin: 'JFK', destination: 'SFO', distance: 2586, aircraft_type: 'B787-9', capacity: 280, baseHour: 13, baseMinute: 0 },
  { prefix: 'SK', airline: 'SkyStream Airlines', origin: 'ORD', destination: 'LHR', distance: 3953, aircraft_type: 'B787-9', capacity: 280, baseHour: 19, baseMinute: 0 },
  { prefix: 'SK', airline: 'SkyStream Airlines', origin: 'LHR', destination: 'ORD', distance: 3953, aircraft_type: 'B787-9', capacity: 280, baseHour: 10, baseMinute: 0 },

  // AeroVantage International (12 routes)
  { prefix: 'AV', airline: 'AeroVantage International', origin: 'ORD', destination: 'FRA', distance: 4344, aircraft_type: 'B777-300ER', capacity: 350, baseHour: 16, baseMinute: 0 },
  { prefix: 'AV', airline: 'AeroVantage International', origin: 'FRA', destination: 'ORD', distance: 4344, aircraft_type: 'B777-300ER', capacity: 350, baseHour: 10, baseMinute: 15 },
  { prefix: 'AV', airline: 'AeroVantage International', origin: 'ATL', destination: 'MCO', distance: 404, aircraft_type: 'B737-MAX8', capacity: 178, baseHour: 7, baseMinute: 30 },
  { prefix: 'AV', airline: 'AeroVantage International', origin: 'MCO', destination: 'ATL', distance: 404, aircraft_type: 'B737-MAX8', capacity: 178, baseHour: 9, baseMinute: 45 },
  { prefix: 'AV', airline: 'AeroVantage International', origin: 'SIN', destination: 'HND', distance: 3324, aircraft_type: 'A350-900', capacity: 300, baseHour: 10, baseMinute: 0 },
  { prefix: 'AV', airline: 'AeroVantage International', origin: 'HND', destination: 'SIN', distance: 3324, aircraft_type: 'A350-900', capacity: 300, baseHour: 18, baseMinute: 0 },
  { prefix: 'AV', airline: 'AeroVantage International', origin: 'LHR', destination: 'FRA', distance: 407, aircraft_type: 'A320neo', capacity: 156, baseHour: 7, baseMinute: 15 },
  { prefix: 'AV', airline: 'AeroVantage International', origin: 'FRA', destination: 'LHR', distance: 407, aircraft_type: 'A320neo', capacity: 156, baseHour: 10, baseMinute: 45 },
  { prefix: 'AV', airline: 'AeroVantage International', origin: 'CDG', destination: 'JFK', distance: 3635, aircraft_type: 'B777-300ER', capacity: 340, baseHour: 13, baseMinute: 15 },
  { prefix: 'AV', airline: 'AeroVantage International', origin: 'JFK', destination: 'CDG', distance: 3635, aircraft_type: 'B777-300ER', capacity: 340, baseHour: 20, baseMinute: 30 },
  { prefix: 'AV', airline: 'AeroVantage International', origin: 'FRA', destination: 'DXB', distance: 3009, aircraft_type: 'A350-900', capacity: 310, baseHour: 14, baseMinute: 0 },
  { prefix: 'AV', airline: 'AeroVantage International', origin: 'DXB', destination: 'FRA', distance: 3009, aircraft_type: 'A350-900', capacity: 310, baseHour: 21, baseMinute: 15 },

  // Pacific Horizon Air (13 routes)
  { prefix: 'PH', airline: 'Pacific Horizon Air', origin: 'SEA', destination: 'SFO', distance: 678, aircraft_type: 'A320neo', capacity: 162, baseHour: 8, baseMinute: 45 },
  { prefix: 'PH', airline: 'Pacific Horizon Air', origin: 'SFO', destination: 'SEA', distance: 678, aircraft_type: 'A320neo', capacity: 162, baseHour: 11, baseMinute: 15 },
  { prefix: 'PH', airline: 'Pacific Horizon Air', origin: 'LAX', destination: 'JFK', distance: 2475, aircraft_type: 'B787-9', capacity: 270, baseHour: 7, baseMinute: 0 },
  { prefix: 'PH', airline: 'Pacific Horizon Air', origin: 'JFK', destination: 'LAX', distance: 2475, aircraft_type: 'B787-9', capacity: 270, baseHour: 16, baseMinute: 30 },
  { prefix: 'PH', airline: 'Pacific Horizon Air', origin: 'SFO', destination: 'HND', distance: 5160, aircraft_type: 'B787-9', capacity: 268, baseHour: 13, baseMinute: 30 },
  { prefix: 'PH', airline: 'Pacific Horizon Air', origin: 'HND', destination: 'SFO', distance: 5160, aircraft_type: 'B787-9', capacity: 268, baseHour: 19, baseMinute: 30 },
  { prefix: 'PH', airline: 'Pacific Horizon Air', origin: 'SEA', destination: 'DEN', distance: 1024, aircraft_type: 'A321neo', capacity: 192, baseHour: 7, baseMinute: 30 },
  { prefix: 'PH', airline: 'Pacific Horizon Air', origin: 'DEN', destination: 'SEA', distance: 1024, aircraft_type: 'A321neo', capacity: 192, baseHour: 11, baseMinute: 45 },
  { prefix: 'PH', airline: 'Pacific Horizon Air', origin: 'SEA', destination: 'ORD', distance: 1721, aircraft_type: 'B737-MAX8', capacity: 174, baseHour: 14, baseMinute: 0 },
  { prefix: 'PH', airline: 'Pacific Horizon Air', origin: 'LAX', destination: 'SEA', distance: 954, aircraft_type: 'A320neo', capacity: 162, baseHour: 6, baseMinute: 30 },
  { prefix: 'PH', airline: 'Pacific Horizon Air', origin: 'SEA', destination: 'LAX', distance: 954, aircraft_type: 'A320neo', capacity: 162, baseHour: 10, baseMinute: 0 },
  { prefix: 'PH', airline: 'Pacific Horizon Air', origin: 'DEN', destination: 'LAX', distance: 862, aircraft_type: 'A320neo', capacity: 158, baseHour: 9, baseMinute: 30 },
  { prefix: 'PH', airline: 'Pacific Horizon Air', origin: 'LAX', destination: 'DEN', distance: 862, aircraft_type: 'A320neo', capacity: 158, baseHour: 12, baseMinute: 45 },

  // Continental Jetway (10 routes)
  { prefix: 'CJ', airline: 'Continental Jetway', origin: 'DFW', destination: 'DEN', distance: 641, aircraft_type: 'A321neo', capacity: 190, baseHour: 9, baseMinute: 10 },
  { prefix: 'CJ', airline: 'Continental Jetway', origin: 'DEN', destination: 'DFW', distance: 641, aircraft_type: 'A321neo', capacity: 190, baseHour: 12, baseMinute: 0 },
  { prefix: 'CJ', airline: 'Continental Jetway', origin: 'DFW', destination: 'ORD', distance: 802, aircraft_type: 'B737-800', capacity: 166, baseHour: 14, baseMinute: 20 },
  { prefix: 'CJ', airline: 'Continental Jetway', origin: 'ORD', destination: 'DFW', distance: 802, aircraft_type: 'B737-800', capacity: 166, baseHour: 17, baseMinute: 45 },
  { prefix: 'CJ', airline: 'Continental Jetway', origin: 'ATL', destination: 'DFW', distance: 731, aircraft_type: 'B737-MAX8', capacity: 172, baseHour: 11, baseMinute: 0 },
  { prefix: 'CJ', airline: 'Continental Jetway', origin: 'DFW', destination: 'ATL', distance: 731, aircraft_type: 'B737-MAX8', capacity: 172, baseHour: 14, baseMinute: 30 },
  { prefix: 'CJ', airline: 'Continental Jetway', origin: 'ORD', destination: 'JFK', distance: 740, aircraft_type: 'A320neo', capacity: 156, baseHour: 8, baseMinute: 15 },
  { prefix: 'CJ', airline: 'Continental Jetway', origin: 'JFK', destination: 'ORD', distance: 740, aircraft_type: 'A320neo', capacity: 156, baseHour: 11, baseMinute: 30 },
  { prefix: 'CJ', airline: 'Continental Jetway', origin: 'ATL', destination: 'JFK', distance: 760, aircraft_type: 'B737-800', capacity: 166, baseHour: 8, baseMinute: 0 },
  { prefix: 'CJ', airline: 'Continental Jetway', origin: 'JFK', destination: 'ATL', distance: 760, aircraft_type: 'B737-800', capacity: 166, baseHour: 15, baseMinute: 15 },
];

const DATES = [
  '2026-11-10',
  '2026-11-11',
  '2026-11-12',
  '2026-11-13',
  '2026-11-14',
  '2026-11-15',
  '2026-11-16',
];

const DELAY_CAUSES = [
  'ATC Flow',
  'Turnaround Baggage',
  'Weather',
  'Aircraft Maintenance',
  'Crew Rest',
] as const;

const DELAY_DURATIONS = [25, 35, 42, 48, 55, 65, 70, 75, 85, 95, 110, 125];

function formatHHMM(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function buildSyntheticDataset(): FlightRecord[] {
  const records: FlightRecord[] = [];
  const carrierCounters: Record<string, number> = {
    SK: 101,
    AV: 101,
    PH: 101,
    CJ: 101,
  };

  // 7 consecutive days: 43 flights/day for days 0..5, 42 flights on day 6 = 300 total flights
  let globalIndex = 0;
  for (let dayIdx = 0; dayIdx < DATES.length; dayIdx++) {
    const flightsToday = dayIdx < 6 ? 43 : 42;
    const dateStr = DATES[dayIdx];

    for (let slot = 0; slot < flightsToday; slot++) {
      const tpl = ROUTE_TEMPLATES[(dayIdx * 7 + slot) % ROUTE_TEMPLATES.length];
      const flightNum = carrierCounters[tpl.prefix]++;
      const flightId = `${tpl.prefix}-${flightNum}`;

      // Deterministic pseudo-random index for realistic status & delay distribution
      const hash = (globalIndex * 37 + dayIdx * 13 + slot * 19) % 100;

      let status: FlightRecord['flight_status'] = 'ON_TIME';
      let delayMinutes = 0;
      let delayReason: NonNullable<FlightRecord['delay_reason']> = 'None';

      // ~3% cancelled (9 flights), ~22% delayed (66 flights), ~75% on-time (225 flights)
      if (globalIndex % 33 === 11 && records.filter((r) => r.flight_status === 'CANCELLED').length < 9) {
        status = 'CANCELLED';
        delayMinutes = 0;
        delayReason = DELAY_CAUSES[(globalIndex + dayIdx) % 3 === 0 ? 3 : 2]; // Weather or Aircraft Maintenance
      } else if (hash < 23) {
        status = 'DELAYED';
        delayMinutes = DELAY_DURATIONS[(globalIndex + dayIdx * 3) % DELAY_DURATIONS.length];
        // Weight causes realistically: ATC Flow & Turnaround Baggage most frequent
        const causeBucket = (globalIndex + slot) % 10;
        if (causeBucket < 3) delayReason = 'ATC Flow';
        else if (causeBucket < 6) delayReason = 'Turnaround Baggage';
        else if (causeBucket < 8) delayReason = 'Weather';
        else if (causeBucket === 8) delayReason = 'Aircraft Maintenance';
        else delayReason = 'Crew Rest';
      } else {
        status = 'ON_TIME';
        // Mix of 0, 2, 4, 5, 8, 10, 12 minute departures within OTP-15
        delayMinutes = [0, 2, 4, 5, 7, 8, 10, 12][globalIndex % 8];
        delayReason = 'None';
      }

      const schedMinutes = tpl.baseHour * 60 + tpl.baseMinute + ((slot % 3) * 15);
      const scheduledDeparture = formatHHMM(schedMinutes);
      const actualDeparture =
        status === 'CANCELLED' ? scheduledDeparture : formatHHMM(schedMinutes + delayMinutes);

      const loadFactor = 0.84 + ((globalIndex % 11) * 0.01);
      const passengerLoad = status === 'CANCELLED' ? 0 : Math.round(tpl.capacity * loadFactor);

      records.push({
        flight_id: flightId,
        airline: tpl.airline,
        origin: tpl.origin,
        destination: tpl.destination,
        scheduled_departure: scheduledDeparture,
        actual_departure: actualDeparture,
        delay_minutes: delayMinutes,
        flight_status: status,
        distance: tpl.distance,
        date: dateStr,
        delay_reason: delayReason,
        aircraft_type: tpl.aircraft_type,
        passenger_load: passengerLoad,
      });

      globalIndex++;
    }
  }

  return records;
}

export const SYNTHETIC_AIRLINE_DATASET: FlightRecord[] = buildSyntheticDataset();
