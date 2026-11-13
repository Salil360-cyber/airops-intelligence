import { FlightRecord, CSVValidationReport } from '../types';

export interface CSVParseResult {
  data: FlightRecord[];
  report: CSVValidationReport;
  errors: string[];
  warnings: string[];
  headers: string[];
  rowCount: number;
}

export function parseCSVAdvanced(
  csvContent: string,
  fileName = 'uploaded_flights.csv',
  fileSizeBytes = 0
): CSVParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const invalidRowDetails: { line: number; raw: string; error: string }[] = [];
  const duplicateFlightIds: string[] = [];

  const lines = csvContent
    .split(/\r\n|\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    const emptyReport: CSVValidationReport = {
      fileName,
      fileSizeBytes,
      totalRowsParsed: 0,
      validRowsCount: 0,
      invalidRowsCount: 0,
      duplicateCount: 0,
      completenessScore: 0,
      detectedHeaders: [],
      missingRequiredHeaders: ['flight_id', 'origin', 'destination'],
      detectedAirlines: [],
      detectedAirports: [],
      dateRange: { min: '', max: '' },
      invalidRowDetails: [],
      duplicateFlightIds: [],
      warnings: ['The uploaded CSV file is empty.'],
      previewRows: [],
      validRecords: [],
    };
    return {
      data: [],
      report: emptyReport,
      errors: ['The uploaded CSV file is empty. Please provide a file with a header row and flight records.'],
      warnings: [],
      headers: [],
      rowCount: 0,
    };
  }

  // Parse header line
  const rawHeaders = splitCSVLine(lines[0]);
  const headers = rawHeaders.map((h) =>
    h.toLowerCase().trim().replace(/^"|"$/g, '').replace(/\s+/g, '_')
  );

  // Normalize column aliases
  const headerMap: Record<string, string> = {};
  headers.forEach((h, idx) => {
    if (['flight_id', 'flight', 'flight_num', 'flight_number', 'flt_no'].includes(h)) {
      headerMap['flight_id'] = headers[idx];
    } else if (['carrier', 'airline', 'airline_name', 'operator'].includes(h)) {
      headerMap['airline'] = headers[idx];
    } else if (['origin', 'from', 'dep_airport', 'departure_airport', 'orig'].includes(h)) {
      headerMap['origin'] = headers[idx];
    } else if (['destination', 'to', 'arr_airport', 'arrival_airport', 'dest'].includes(h)) {
      headerMap['destination'] = headers[idx];
    } else if (['scheduled_departure', 'sched_dep', 'std', 'sched_departure_time'].includes(h)) {
      headerMap['scheduled_departure'] = headers[idx];
    } else if (['actual_departure', 'act_dep', 'atd', 'actual_departure_time'].includes(h)) {
      headerMap['actual_departure'] = headers[idx];
    } else if (['delay_minutes', 'delay', 'dep_delay', 'delay_mins'].includes(h)) {
      headerMap['delay_minutes'] = headers[idx];
    } else if (['flight_status', 'status', 'state'].includes(h)) {
      headerMap['flight_status'] = headers[idx];
    } else if (['distance', 'miles', 'dist_miles'].includes(h)) {
      headerMap['distance'] = headers[idx];
    } else if (['date', 'flight_date', 'dep_date'].includes(h)) {
      headerMap['date'] = headers[idx];
    } else if (['delay_reason', 'delay_cause', 'reason', 'cause'].includes(h)) {
      headerMap['delay_reason'] = headers[idx];
    } else if (['aircraft_type', 'aircraft', 'equipment', 'ac_type'].includes(h)) {
      headerMap['aircraft_type'] = headers[idx];
    } else if (['passenger_load', 'passengers', 'pax', 'load'].includes(h)) {
      headerMap['passenger_load'] = headers[idx];
    }
  });

  const requiredFields = ['flight_id', 'origin', 'destination'];
  const missingRequired = requiredFields.filter((req) => !headerMap[req]);

  if (missingRequired.length > 0) {
    errors.push(
      `Missing required column headers: ${missingRequired.join(', ')}. Detected headers: [${rawHeaders.join(', ')}].`
    );
    const failedReport: CSVValidationReport = {
      fileName,
      fileSizeBytes,
      totalRowsParsed: lines.length - 1,
      validRowsCount: 0,
      invalidRowsCount: lines.length - 1,
      duplicateCount: 0,
      completenessScore: 0,
      detectedHeaders: rawHeaders,
      missingRequiredHeaders: missingRequired,
      detectedAirlines: [],
      detectedAirports: [],
      dateRange: { min: '', max: '' },
      invalidRowDetails: [],
      duplicateFlightIds: [],
      warnings: errors,
      previewRows: [],
      validRecords: [],
    };
    return {
      data: [],
      report: failedReport,
      errors,
      warnings,
      headers: rawHeaders,
      rowCount: 0,
    };
  }

  const validRecords: FlightRecord[] = [];
  const seenFlightIds = new Set<string>();
  const airlinesSet = new Set<string>();
  const airportsSet = new Set<string>();
  const datesSet = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const rawValues = splitCSVLine(rawLine);
    if (rawValues.length === 0 || (rawValues.length === 1 && rawValues[0] === '')) {
      continue;
    }

    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = rawValues[idx] ? rawValues[idx].trim().replace(/^"|"$/g, '') : '';
    });

    const getVal = (canonicalKey: string): string => {
      const actualHeader = headerMap[canonicalKey];
      return actualHeader && rowObj[actualHeader] !== undefined ? rowObj[actualHeader].trim() : '';
    };

    const flightId = getVal('flight_id');
    const origin = getVal('origin').toUpperCase();
    const destination = getVal('destination').toUpperCase();

    // Line Validation
    const rowErrors: string[] = [];
    if (!flightId) {
      rowErrors.push('Missing flight_id');
    }
    if (!origin) {
      rowErrors.push('Missing origin');
    }
    if (!destination) {
      rowErrors.push('Missing destination');
    }
    if (origin && destination && origin === destination) {
      rowErrors.push(`Origin and destination cannot be identical (${origin})`);
    }

    if (rowErrors.length > 0) {
      invalidRowDetails.push({
        line: i + 1,
        raw: rawLine.length > 80 ? rawLine.substring(0, 80) + '...' : rawLine,
        error: rowErrors.join(', '),
      });
      continue;
    }

    // Duplicate check
    if (seenFlightIds.has(flightId)) {
      if (!duplicateFlightIds.includes(flightId)) {
        duplicateFlightIds.push(flightId);
      }
    } else {
      seenFlightIds.add(flightId);
    }

    const airline = getVal('airline') || 'Standard Carrier';
    airlinesSet.add(airline);
    airportsSet.add(origin);
    airportsSet.add(destination);

    // Parse and normalize time
    let scheduled = getVal('scheduled_departure') || '12:00';
    scheduled = normalizeTime(scheduled);

    let actual = getVal('actual_departure');
    if (actual) {
      actual = normalizeTime(actual);
    } else {
      actual = scheduled;
    }

    // Parse delay minutes
    const rawDelay = getVal('delay_minutes');
    let delay = parseInt(rawDelay, 10);
    if (isNaN(delay)) {
      delay = 0;
    }

    // Parse flight status
    let status = getVal('flight_status').toUpperCase();
    if (!['ON_TIME', 'DELAYED', 'CANCELLED', 'DIVERTED'].includes(status)) {
      if (status === 'ON-TIME' || status === 'ONTIME') status = 'ON_TIME';
      else if (status === 'DELAY') status = 'DELAYED';
      else if (status === 'CNX' || status === 'CANCEL') status = 'CANCELLED';
      else if (status === 'DIV' || status === 'DIVERT') status = 'DIVERTED';
      else {
        status = delay > 15 ? 'DELAYED' : 'ON_TIME';
      }
    }

    // Parse distance
    const rawDist = getVal('distance');
    let distance = parseInt(rawDist, 10);
    if (isNaN(distance) || distance <= 0) {
      distance = 500;
    }

    // Parse date
    let rawDate = getVal('date');
    const parsedDate = normalizeDate(rawDate);
    if (parsedDate) {
      datesSet.add(parsedDate);
    }

    // Parse delay reason (strictly preserve original data; do NOT fabricate causes)
    const rawReason = getVal('delay_reason');
    const delayReason = rawReason && rawReason.trim().length > 0 && rawReason !== 'None' ? rawReason : undefined;
    const aircraftType = getVal('aircraft_type') || undefined;
    const rawPax = getVal('passenger_load');
    const parsedPax = rawPax !== '' ? parseInt(rawPax, 10) : NaN;
    const passengerLoad = !isNaN(parsedPax) && parsedPax >= 0 ? parsedPax : undefined;

    validRecords.push({
      flight_id: flightId,
      airline,
      origin,
      destination,
      scheduled_departure: scheduled,
      actual_departure: actual,
      delay_minutes: delay,
      flight_status: status as any,
      distance,
      date: parsedDate,
      delay_reason: delayReason as any,
      aircraft_type: aircraftType,
      passenger_load: passengerLoad,
    });
  }

  // Duplicate warnings
  if (duplicateFlightIds.length > 0) {
    warnings.push(
      `Detected ${duplicateFlightIds.length} duplicate flight ID(s): [${duplicateFlightIds.slice(0, 5).join(', ')}${duplicateFlightIds.length > 5 ? '...' : ''}].`
    );
  }

  if (invalidRowDetails.length > 0) {
    warnings.push(
      `Filtered out ${invalidRowDetails.length} malformed or invalid row(s) out of ${lines.length - 1} total rows.`
    );
  }

  const sortedDates = Array.from(datesSet).sort();
  const minDate = sortedDates[0] || '';
  const maxDate = sortedDates[sortedDates.length - 1] || '';

  // Completeness score
  const totalCells = validRecords.length * 10;
  const missingCounter = validRecords.reduce((acc, r) => {
    let missing = 0;
    if (!r.aircraft_type) missing++;
    if (!r.delay_reason || r.delay_reason === 'None') missing++;
    if (r.passenger_load === undefined) missing++;
    return acc + missing;
  }, 0);
  const completenessScore = totalCells > 0
    ? Math.max(0, Math.round(((totalCells - missingCounter) / totalCells) * 100))
    : 100;

  const report: CSVValidationReport = {
    fileName,
    fileSizeBytes,
    totalRowsParsed: lines.length - 1,
    validRowsCount: validRecords.length,
    invalidRowsCount: invalidRowDetails.length,
    duplicateCount: duplicateFlightIds.length,
    completenessScore,
    detectedHeaders: rawHeaders,
    missingRequiredHeaders: [],
    detectedAirlines: Array.from(airlinesSet).sort(),
    detectedAirports: Array.from(airportsSet).sort(),
    dateRange: { min: minDate, max: maxDate },
    invalidRowDetails,
    duplicateFlightIds,
    warnings,
    previewRows: validRecords.slice(0, 8),
    validRecords,
  };

  return {
    data: validRecords,
    report,
    errors,
    warnings,
    headers: rawHeaders,
    rowCount: validRecords.length,
  };
}

// Backward-compatible parseCSV function
export function parseCSV(csvContent: string): { data: FlightRecord[]; errors: string[]; warnings: string[]; headers: string[]; rowCount: number } {
  const result = parseCSVAdvanced(csvContent);
  return {
    data: result.data,
    errors: result.errors,
    warnings: result.warnings,
    headers: result.headers,
    rowCount: result.rowCount,
  };
}

function normalizeTime(timeStr: string): string {
  if (!timeStr) return '12:00';
  const trimmed = timeStr.trim();

  // ISO datetime string e.g. 2026-11-12T08:00:00Z
  const isoMatch = trimmed.match(/T(\d{2}):(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}:${isoMatch[2]}`;
  }

  // 12-hour AM/PM format e.g. 8:05 AM, 11:30 PM
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hour = parseInt(ampmMatch[1], 10);
    const mm = ampmMatch[2];
    const period = ampmMatch[3].toUpperCase();
    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${mm}`;
  }

  // Standard 24h HH:mm(:ss)
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match) {
    const hh = match[1].padStart(2, '0');
    const mm = match[2];
    return `${hh}:${mm}`;
  }
  return trimmed;
}

function normalizeDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  // Check YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  // Check MM/DD/YYYY
  const mdy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    const mm = mdy[1].padStart(2, '0');
    const dd = mdy[2].padStart(2, '0');
    const yyyy = mdy[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  // Try Date parse
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

const escapeCSVCell = (val: string | number | undefined): string => {
  const str = String(val ?? '');
  return `"${str.replace(/"/g, '""')}"`;
};

export function exportToCSV(flights: FlightRecord[]): string {
  const headers = [
    'flight_id',
    'airline',
    'origin',
    'destination',
    'scheduled_departure',
    'actual_departure',
    'delay_minutes',
    'flight_status',
    'distance',
    'date',
    'delay_reason',
    'aircraft_type',
    'passenger_load',
  ];

  const rows = flights.map((f) => [
    escapeCSVCell(f.flight_id),
    escapeCSVCell(f.airline),
    escapeCSVCell(f.origin),
    escapeCSVCell(f.destination),
    escapeCSVCell(f.scheduled_departure),
    escapeCSVCell(f.actual_departure),
    f.delay_minutes,
    escapeCSVCell(f.flight_status),
    f.distance,
    escapeCSVCell(f.date),
    escapeCSVCell(f.delay_reason || 'None'),
    escapeCSVCell(f.aircraft_type || ''),
    f.passenger_load ?? 0,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export const SAMPLE_CSV_TEMPLATE = `flight_id,airline,origin,destination,scheduled_departure,actual_departure,delay_minutes,flight_status,distance,date,delay_reason,aircraft_type,passenger_load
SK-101,SkyStream Airlines,JFK,LHR,08:00,08:05,5,ON_TIME,3451,2026-11-10,None,B787-9,268
SK-102,SkyStream Airlines,LHR,JFK,11:30,12:45,75,DELAYED,3451,2026-11-10,ATC Flow,B787-9,254
SK-204,SkyStream Airlines,SFO,ORD,06:15,06:12,0,ON_TIME,1846,2026-11-10,None,A321neo,182
SK-205,SkyStream Airlines,ORD,SFO,13:00,14:20,80,DELAYED,1846,2026-11-10,Weather,A321neo,190
AV-401,AeroVantage International,ORD,FRA,16:00,16:10,10,ON_TIME,4344,2026-11-10,None,B777-300ER,340
AV-402,AeroVantage International,FRA,ORD,10:15,11:45,90,DELAYED,4344,2026-11-10,Aircraft Maintenance,B777-300ER,328
PH-602,Pacific Horizon Air,SFO,SEA,11:15,11:15,0,CANCELLED,678,2026-11-10,Aircraft Maintenance,A320neo,0
`;
