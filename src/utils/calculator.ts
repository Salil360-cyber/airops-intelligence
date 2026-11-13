import { FlightRecord, OperationalMetrics, BusinessInsight } from '../types';

export function calculateOperationalMetrics(
  flights: FlightRecord[],
  otpThreshold = 15
): OperationalMetrics {
  const totalFlights = flights.length;

  if (totalFlights === 0) {
    return {
      totalFlights: 0,
      onTimeFlights: 0,
      delayedFlights: 0,
      cancelledFlights: 0,
      divertedFlights: 0,
      onTimePerformance: 0,
      delayPercentage: 0,
      cancellationRate: 0,
      avgDelayMinutes: 0,
      medianDelayMinutes: 0,
      maxDelay: { minutes: 0, flight_id: 'N/A', route: 'N/A' },
      avgDelayAllFlights: 0,
      totalDelayMinutes: 0,
      hasDelayCauses: false,
      topDelayCauses: [],
      topDelayedRoutes: [],
      bestRoutes: [],
      hourlyDistribution: [],
      airlineBreakdown: [],
      airports: { origins: [], destinations: [], allAirports: [] },
      dateRange: { minDate: '', maxDate: '', uniqueDates: [] },
      dataQuality: {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        duplicateRows: 0,
        missingValues: {},
        completenessScore: 100,
        detectedAirlines: [],
        detectedAirports: [],
        dateCoverage: 'No data',
        qualityWarnings: ['No flight records in active dataset.'],
      },
    };
  }

  let onTimeFlights = 0;
  let delayedFlights = 0;
  let cancelledFlights = 0;
  let divertedFlights = 0;
  let totalDelayMinutes = 0;

  const delayList: number[] = [];
  let maxDelayFlight = {
    minutes: 0,
    flight_id: 'N/A',
    route: 'N/A',
    airline: 'N/A',
  };

  const causeCounts: Record<string, { count: number; minutes: number }> = {};
  const routeMap: Record<
    string,
    { origin: string; destination: string; count: number; onTime: number; delayed: number; cancelled: number; totalMinutes: number }
  > = {};
  const hourMap: Record<string, { count: number; delayed: number; totalMinutes: number }> = {};
  const airlineMap: Record<
    string,
    { count: number; delayed: number; cancelled: number; totalMinutes: number }
  > = {};

  const missingCounts: Record<string, number> = {
    flight_id: 0,
    airline: 0,
    origin: 0,
    destination: 0,
    scheduled_departure: 0,
    actual_departure: 0,
    delay_minutes: 0,
    flight_status: 0,
    distance: 0,
    date: 0,
    delay_reason: 0,
    aircraft_type: 0,
    passenger_load: 0,
  };

  const originsSet = new Set<string>();
  const destinationsSet = new Set<string>();
  const allAirportsSet = new Set<string>();
  const airlinesSet = new Set<string>();
  const datesSet = new Set<string>();
  const seenIds = new Set<string>();
  let duplicateCount = 0;
  const qualityWarnings: string[] = [];

  let validRowCount = 0;
  let causeRecordedCount = 0;

  flights.forEach((f, idx) => {
    let rowValid = true;

    // Duplicate check
    if (f.flight_id) {
      if (seenIds.has(f.flight_id)) {
        duplicateCount++;
      } else {
        seenIds.add(f.flight_id);
      }
    } else {
      missingCounts.flight_id++;
      rowValid = false;
    }

    if (!f.airline) { missingCounts.airline++; rowValid = false; } else { airlinesSet.add(f.airline); }
    if (!f.origin) { missingCounts.origin++; rowValid = false; } else { originsSet.add(f.origin); allAirportsSet.add(f.origin); }
    if (!f.destination) { missingCounts.destination++; rowValid = false; } else { destinationsSet.add(f.destination); allAirportsSet.add(f.destination); }
    if (!f.scheduled_departure) { missingCounts.scheduled_departure++; rowValid = false; }
    if (!f.flight_status) { missingCounts.flight_status++; rowValid = false; }

    const rawStatus = (f.flight_status || (f as any).status || '').toString().trim().toUpperCase();
    const isCancelled = rawStatus === 'CANCELLED';
    const isDiverted = rawStatus === 'DIVERTED';

    if (!f.actual_departure) {
      missingCounts.actual_departure++;
      if (!isCancelled) {
        rowValid = false;
        if (qualityWarnings.length < 5) {
          qualityWarnings.push(`Flight ${f.flight_id || `#${idx + 1}`} is missing actual departure time without cancellation status.`);
        }
      }
    }

    if (f.delay_minutes === undefined || isNaN(Number(f.delay_minutes))) {
      missingCounts.delay_minutes++;
      rowValid = false;
    }

    if (f.distance === undefined || isNaN(Number(f.distance))) missingCounts.distance++;
    if (!f.date) {
      missingCounts.date++;
    } else {
      datesSet.add(f.date);
    }
    
    const rawCause = f.delay_reason || (f as any).delayCause || (f as any).cause;
    if (!rawCause || rawCause === 'None') missingCounts.delay_reason++;
    if (!f.aircraft_type) missingCounts.aircraft_type++;
    if (f.passenger_load === undefined || isNaN(Number(f.passenger_load))) missingCounts.passenger_load++;

    if (rowValid) validRowCount++;

    const hasNumericDelay = f.delay_minutes !== undefined && f.delay_minutes !== null && !isNaN(Number(f.delay_minutes));
    const delay = hasNumericDelay ? Number(f.delay_minutes) : 0;
    // OTP threshold check: respect numeric delay against otpThreshold when present; fallback to DELAYED status if delay is 0/missing
    const isDelayed = !isCancelled && !isDiverted && (hasNumericDelay ? (delay > otpThreshold || (delay === 0 && rawStatus === 'DELAYED')) : rawStatus === 'DELAYED');

    if (isCancelled) {
      cancelledFlights++;
    } else if (isDiverted) {
      divertedFlights++;
    } else if (isDelayed) {
      delayedFlights++;
      totalDelayMinutes += delay;
      delayList.push(delay);

      if (delay > maxDelayFlight.minutes) {
        maxDelayFlight = {
          minutes: delay,
          flight_id: f.flight_id,
          route: `${f.origin || '???'}-${f.destination || '???'}`,
          airline: f.airline || '',
        };
      }
    } else {
      onTimeFlights++;
    }

    // Delay causes breakdown (only count flights classified as delayed so percentages sum to ~100%)
    if (isDelayed && rawCause && rawCause !== 'None' && String(rawCause).trim().length > 0) {
      causeRecordedCount++;
      const cause = String(rawCause).trim();
      if (!causeCounts[cause]) {
        causeCounts[cause] = { count: 0, minutes: 0 };
      }
      causeCounts[cause].count += 1;
      causeCounts[cause].minutes += delay;
    }

    // Route calculations
    const route = `${f.origin || '???'}-${f.destination || '???'}`;
    if (!routeMap[route]) {
      routeMap[route] = {
        origin: f.origin || '???',
        destination: f.destination || '???',
        count: 0,
        onTime: 0,
        delayed: 0,
        cancelled: 0,
        totalMinutes: 0,
      };
    }
    routeMap[route].count += 1;
    if (isCancelled) {
      routeMap[route].cancelled += 1;
    } else if (isDelayed) {
      routeMap[route].delayed += 1;
      routeMap[route].totalMinutes += delay;
    } else if (!isDiverted) {
      routeMap[route].onTime += 1;
    }

    // Hourly distribution
    const rawSched = (f.scheduled_departure || '00:00').trim();
    const isoHourMatch = rawSched.match(/T(\d{2}):\d{2}/);
    const stdHourMatch = rawSched.match(/^(\d{1,2}):\d{2}/);
    const parsedHour = isoHourMatch
      ? isoHourMatch[1]
      : stdHourMatch
      ? stdHourMatch[1].padStart(2, '0')
      : '00';
    const schedHour = `${parsedHour}:00`;
    if (!hourMap[schedHour]) {
      hourMap[schedHour] = { count: 0, delayed: 0, totalMinutes: 0 };
    }
    hourMap[schedHour].count += 1;
    if (isDelayed) {
      hourMap[schedHour].delayed += 1;
      hourMap[schedHour].totalMinutes += delay;
    }

    // Airline breakdown
    const airlineName = f.airline || 'Standard Carrier';
    if (!airlineMap[airlineName]) {
      airlineMap[airlineName] = { count: 0, delayed: 0, cancelled: 0, totalMinutes: 0 };
    }
    airlineMap[airlineName].count += 1;
    if (isCancelled) {
      airlineMap[airlineName].cancelled += 1;
    } else if (isDelayed) {
      airlineMap[airlineName].delayed += 1;
      airlineMap[airlineName].totalMinutes += delay;
    }
  });

  // Rates and KPI calculations
  const operativeFlights = totalFlights - cancelledFlights;
  const onTimePerformance = operativeFlights > 0
    ? Math.round((onTimeFlights / operativeFlights) * 1000) / 10
    : 0;

  const delayPercentage = operativeFlights > 0
    ? Math.round((delayedFlights / operativeFlights) * 1000) / 10
    : 0;

  const cancellationRate = totalFlights > 0
    ? Math.round((cancelledFlights / totalFlights) * 1000) / 10
    : 0;

  const avgDelayMinutes = delayedFlights > 0
    ? Math.round((totalDelayMinutes / delayedFlights) * 10) / 10
    : 0;

  const avgDelayAllFlights = operativeFlights > 0
    ? Math.round((totalDelayMinutes / operativeFlights) * 10) / 10
    : 0;

  // Median Delay Calculation
  let medianDelayMinutes = 0;
  if (delayList.length > 0) {
    const sorted = [...delayList].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      medianDelayMinutes = Math.round((sorted[mid - 1] + sorted[mid]) / 2);
    } else {
      medianDelayMinutes = sorted[mid];
    }
  }

  // Format top delay causes
  const hasDelayCauses = causeRecordedCount > 0;
  const topDelayCauses = Object.entries(causeCounts)
    .map(([cause, data]) => ({
      cause,
      count: data.count,
      totalMinutes: data.minutes,
      percentage: delayedFlights > 0 ? Math.round((data.count / delayedFlights) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Format top delayed routes
  const topDelayedRoutes = Object.entries(routeMap)
    .map(([route, data]) => {
      const operativeRouteLegs = data.count - data.cancelled;
      const routeOtp = operativeRouteLegs > 0
        ? Math.round((data.onTime / operativeRouteLegs) * 1000) / 10
        : 0;
      return {
        route,
        origin: data.origin,
        destination: data.destination,
        totalFlights: data.count,
        delayedCount: data.delayed,
        avgDelay: data.delayed > 0 ? Math.round((data.totalMinutes / data.delayed) * 10) / 10 : 0,
        otp: routeOtp,
      };
    })
    .sort((a, b) => b.delayedCount - a.delayedCount || b.avgDelay - a.avgDelay);

  // Format best performing routes (highest OTP, lowest delay)
  const bestRoutes = Object.entries(routeMap)
    .map(([route, data]) => {
      const operativeRouteLegs = data.count - data.cancelled;
      const routeOtp = operativeRouteLegs > 0
        ? Math.round((data.onTime / operativeRouteLegs) * 1000) / 10
        : 0;
      return {
        route,
        origin: data.origin,
        destination: data.destination,
        totalFlights: data.count,
        otp: routeOtp,
        avgDelay: data.delayed > 0 ? Math.round((data.totalMinutes / data.delayed) * 10) / 10 : 0,
      };
    })
    .sort((a, b) => b.otp - a.otp || a.avgDelay - b.avgDelay);

  // Format hourly distribution
  const hourlyDistribution = Object.entries(hourMap)
    .map(([hour, data]) => ({
      hour,
      total: data.count,
      delayed: data.delayed,
      avgDelay: data.delayed > 0 ? Math.round(data.totalMinutes / data.delayed) : 0,
    }))
    .sort((a, b) => a.hour.localeCompare(b.hour));

  // Format airline breakdown
  const airlineBreakdown = Object.entries(airlineMap)
    .map(([airline, data]) => ({
      airline,
      total: data.count,
      delayed: data.delayed,
      cancelled: data.cancelled,
      otp: data.count > data.cancelled
        ? Math.round(((data.count - data.cancelled - data.delayed) / (data.count - data.cancelled)) * 1000) / 10
        : 0,
      avgDelay: data.delayed > 0 ? Math.round((data.totalMinutes / data.delayed) * 10) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Date coverage
  const sortedDates = Array.from(datesSet).sort();
  const minDate = sortedDates[0] || '';
  const maxDate = sortedDates[sortedDates.length - 1] || '';
  const dateCoverage = minDate === maxDate ? (minDate || 'Undated') : `${minDate} to ${maxDate}`;

  // Completeness score
  const coreFields = ['flight_id', 'airline', 'origin', 'destination', 'scheduled_departure', 'actual_departure', 'delay_minutes', 'flight_status'];
  const totalCoreCells = totalFlights * coreFields.length;
  const missingCoreCells = coreFields.reduce((acc, field) => acc + (missingCounts[field] || 0), 0);
  const completenessScore = totalCoreCells > 0
    ? Math.max(0, Math.round(((totalCoreCells - missingCoreCells) / totalCoreCells) * 100))
    : 100;

  if (duplicateCount > 0) {
    qualityWarnings.unshift(`${duplicateCount} duplicate flight ID instances detected in dataset.`);
  }

  return {
    totalFlights,
    onTimeFlights,
    delayedFlights,
    cancelledFlights,
    divertedFlights,
    onTimePerformance,
    delayPercentage,
    cancellationRate,
    avgDelayMinutes,
    medianDelayMinutes,
    maxDelay: maxDelayFlight,
    avgDelayAllFlights,
    totalDelayMinutes,
    hasDelayCauses,
    topDelayCauses,
    topDelayedRoutes,
    bestRoutes,
    hourlyDistribution,
    airlineBreakdown,
    airports: {
      origins: Array.from(originsSet).sort(),
      destinations: Array.from(destinationsSet).sort(),
      allAirports: Array.from(allAirportsSet).sort(),
    },
    dateRange: {
      minDate,
      maxDate,
      uniqueDates: sortedDates,
    },
    dataQuality: {
      totalRows: totalFlights,
      validRows: validRowCount,
      invalidRows: totalFlights - validRowCount,
      duplicateRows: duplicateCount,
      missingValues: missingCounts,
      completenessScore,
      detectedAirlines: Array.from(airlinesSet).sort(),
      detectedAirports: Array.from(allAirportsSet).sort(),
      dateCoverage,
      qualityWarnings,
    },
  };
}

export function generateBusinessInsights(
  metrics: OperationalMetrics,
  flights: FlightRecord[]
): BusinessInsight[] {
  const insights: BusinessInsight[] = [];

  // 1. Route Bottleneck Observation
  if (metrics.topDelayedRoutes.length > 0) {
    const worstRoute = metrics.topDelayedRoutes[0];
    const delayRatio = Math.round((worstRoute.delayedCount / worstRoute.totalFlights) * 100);
    if (delayRatio >= 40) {
      insights.push({
        id: 'ins-1',
        category: 'BOTTLENECK',
        severity: 'HIGH',
        title: `Severe Corridor Congestion on ${worstRoute.route}`,
        fact: `Route ${worstRoute.route} recorded a ${delayRatio}% delay rate (${worstRoute.delayedCount} of ${worstRoute.totalFlights} flights delayed), accumulating ${worstRoute.avgDelay} min average delay.`,
        interpretation: `Corridor ${worstRoute.route} achieved ${worstRoute.otp}% OTP compared to the network OTP of ${metrics.onTimePerformance}%, with ${worstRoute.delayedCount} of ${worstRoute.totalFlights} legs delayed by an average of ${worstRoute.avgDelay} min.`,
        actionItem: `Review schedule buffer and ground handling turnaround records for ${worstRoute.route}.`,
      });
    }
  }

  // 2. Carrier Performance Disparity
  if (metrics.airlineBreakdown.length > 1) {
    const sortedCarriers = [...metrics.airlineBreakdown].sort((a, b) => a.otp - b.otp);
    const worstCarrier = sortedCarriers[0];
    const bestCarrier = sortedCarriers[sortedCarriers.length - 1];
    const disparity = Math.round((bestCarrier.otp - worstCarrier.otp) * 10) / 10;

    if (disparity > 10) {
      insights.push({
        id: 'ins-2',
        category: 'AIRLINE_PERFORMANCE',
        severity: 'MEDIUM',
        title: `Carrier OTP Variance of ${disparity}pp across Network`,
        fact: `${worstCarrier.airline} achieved ${worstCarrier.otp}% OTP compared to ${bestCarrier.airline} at ${bestCarrier.otp}% OTP (a ${disparity} percentage point gap).`,
        interpretation: `Observed carrier reliability spans from ${worstCarrier.airline} (${worstCarrier.otp}% OTP, ${worstCarrier.delayed} delayed, ${worstCarrier.avgDelay}m avg delay) to ${bestCarrier.airline} (${bestCarrier.otp}% OTP, ${bestCarrier.avgDelay}m avg delay).`,
        actionItem: `Present carrier variance metrics at the Joint Operations Review and compare turnaround procedures against ${bestCarrier.airline}.`,
      });
    }
  }

  // 3. Peak Disruption Temporal Window
  if (metrics.hourlyDistribution.length > 0) {
    const sortedHours = [...metrics.hourlyDistribution].sort((a, b) => b.delayed - a.delayed);
    const peakHour = sortedHours[0];
    if (peakHour.delayed > 0) {
      const peakRatio = Math.round((peakHour.delayed / peakHour.total) * 100);
      insights.push({
        id: 'ins-3',
        category: 'TEMPORAL_PEAK',
        severity: 'MEDIUM',
        title: `Operational Disruption Peak at ${peakHour.hour} UTC`,
        fact: `The ${peakHour.hour} departure block experienced the highest disruption volume: ${peakHour.delayed} of ${peakHour.total} flights delayed (${peakRatio}% rate), with an average delay of ${peakHour.avgDelay} minutes.`,
        interpretation: `During the ${peakHour.hour} UTC window, ${peakHour.delayed} of ${peakHour.total} scheduled departures were delayed (${peakRatio}% delay rate, ${peakHour.avgDelay} min average), representing the highest hourly delay count in the dataset.`,
        actionItem: `Review departure bank staffing and turnaround readiness ahead of the ${peakHour.hour} UTC window.`,
      });
    }
  }

  // 4. Root Cause Driver
  if (metrics.hasDelayCauses && metrics.topDelayCauses.length > 0) {
    const topCause = metrics.topDelayCauses[0];
    insights.push({
      id: 'ins-4',
      category: 'BOTTLENECK',
      severity: topCause.percentage > 35 ? 'HIGH' : 'MEDIUM',
      title: `${topCause.cause} Dominates Delay Accumulation`,
      fact: `${topCause.cause} accounts for ${topCause.percentage}% of all recorded delays and ${topCause.totalMinutes.toLocaleString()} minutes of cumulative delay across the network.`,
      interpretation: `${topCause.cause} is the leading recorded delay category with ${topCause.count} affected flights (${topCause.percentage}% of delayed flights) and ${topCause.totalMinutes.toLocaleString()} cumulative delay minutes.`,
      actionItem: `Review ${topCause.cause} incident logs and evaluate targeted mitigation workflows for the most affected routes.`,
    });
  } else if (!metrics.hasDelayCauses) {
    insights.push({
      id: 'ins-4-missing',
      category: 'DATA_QUALITY',
      severity: 'INFO',
      title: 'Delay Root Cause Data Not Available in Dataset',
      fact: 'The active dataset does not contain categorized delay reason codes.',
      interpretation: 'Root cause breakdown requires explicit delay reason entries. Missing cause data is not guessed or synthesized.',
      actionItem: 'Upload a CSV containing a delay_reason column (e.g. Air Traffic Control, Weather, Turnaround Baggage, Aircraft Maintenance, Crew Rest) to enable root cause analysis.',
    });
  }

  // 5. Positive Benchmark / Best Route
  if (metrics.bestRoutes.length > 0) {
    const starRoute = metrics.bestRoutes[0];
    if (starRoute.otp >= 90) {
      insights.push({
        id: 'ins-5',
        category: 'POSITIVE_TREND',
        severity: 'INFO',
        title: `Benchmark Route: ${starRoute.route} Achieves ${starRoute.otp}% OTP`,
        fact: `Route ${starRoute.route} achieved ${starRoute.otp}% on-time performance with only ${starRoute.avgDelay} min average delay across ${starRoute.totalFlights} legs.`,
        interpretation: `Route ${starRoute.route} recorded the strongest punctuality in the active dataset at ${starRoute.otp}% OTP with ${starRoute.avgDelay} min average delay over ${starRoute.totalFlights} legs.`,
        actionItem: 'Document ground handling turnaround practices at the origin station as reference for lower-performing corridors.',
      });
    }
  }

  return insights;
}
