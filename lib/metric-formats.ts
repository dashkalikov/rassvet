import type {OperationsSnapshot} from './operations.ts';
import type {loadSatelliteMetrics} from './operations-orbits.ts';

type Satellite=Awaited<ReturnType<typeof loadSatelliteMetrics>>[number];
type Field=string|number|boolean|null|undefined;

export function metricCsv(rows:ReadonlyArray<Record<string,Field>>,columns:readonly string[]){
  function cell(value:Field){
    // Protect spreadsheet viewers from formula execution in imported catalogue names.
    const text=String(value??'');
    const safe=typeof value==='string'&&/^(\s*[=+\-@]|[\t\r\n])/.test(text)?"'"+text:text;
    return '"'+safe.replaceAll('"','""')+'"';
  }
  return '\uFEFF'+[columns.map(cell),...rows.map(row=>columns.map(key=>cell(row[key])))].map(row=>row.join(',')).join('\r\n')+'\r\n';
}

export function prometheusMetrics(snapshot:OperationsSnapshot,satellites:Satellite[],hourly:Awaited<ReturnType<typeof import('./operations.ts').loadHourlyMetrics>>){
  const out:string[]=[];
  const metric=(name:string,help:string,values:string[])=>{
    out.push('# HELP '+name+' '+help,'# TYPE '+name+' gauge',...values.map(value=>name+value));
  };
  metric('rassvet_data_mode','Whether request metrics use educational simulated data.',['{mode="'+snapshot.dataMode+'"} 1']);
  metric('rassvet_accounts','Current accounts by access group.',[
    '{role="customer"} '+snapshot.totals.customers,'{role="staff"} '+snapshot.totals.staff,
  ]);
  metric('rassvet_blocked_accounts','Currently blocked accounts.',[' '+snapshot.totals.blocked]);
  metric('rassvet_active_sessions','Current unexpired sessions.',[' '+snapshot.totals.activeSessions]);
  metric('rassvet_support_tickets','Stored support requests.',[' '+snapshot.totals.tickets]);
  metric('rassvet_subscriptions','Current local subscriptions and requests by status.',
    (['new','active','paused','cancelled'] as const).map(status=>'{status="'+status+'"} '+snapshot.totals[status]));
  metric('rassvet_api_requests_window','API requests recorded within the requested UTC period.',
    [' '+hourly.reduce((n,row)=>n+row.requests,0)]);
  metric('rassvet_api_errors_window','HTTP errors recorded within the requested UTC period.',[
    '{class="4xx"} '+hourly.reduce((n,row)=>n+row.clientErrors,0),'{class="5xx"} '+hourly.reduce((n,row)=>n+row.serverErrors,0),
  ]);
  const requests=hourly.reduce((n,row)=>n+row.requests,0);
  const duration=hourly.reduce((n,row)=>n+row.totalMs,0);
  metric('rassvet_api_response_mean_seconds','Mean API response duration, in seconds.',requests?[' '+duration/requests/1000]:[]);
  metric('rassvet_api_response_max_seconds','Maximum API response duration, in seconds.',requests?[' '+Math.max(...hourly.map(row=>row.maxMs))/1000]:[]);
  metric('rassvet_satellites','Objects in the saved orbital catalogue.',[' '+satellites.length]);
  metric('rassvet_satellite_epoch_timestamp_seconds','Orbital element epoch (UTC).',
    satellites.map(s=>'{norad="'+s.id+'"} '+Date.parse(s.epoch)/1000));
  metric('rassvet_satellite_model_timestamp_seconds','Timestamp used in the SGP4 calculation.',
    satellites.map(s=>'{norad="'+s.id+'"} '+Date.parse(s.calculatedAt)/1000));
  metric('rassvet_satellite_altitude_km','Calculated altitude in km from CelesTrak elements.',
    satellites.flatMap(s=>s.altKm===null?[]:['{norad="'+s.id+'"} '+s.altKm]));
  metric('rassvet_satellite_speed_km_per_second','Calculated orbital speed in km/s.',
    satellites.flatMap(s=>s.speedKms===null?[]:['{norad="'+s.id+'"} '+s.speedKms]));
  metric('rassvet_satellite_perigee_km','Estimated perigee in km above the reference radius.',
    satellites.map(s=>'{norad="'+s.id+'"} '+s.perigeeKm));
  metric('rassvet_satellite_apogee_km','Estimated apogee in km above the reference radius.',
    satellites.map(s=>'{norad="'+s.id+'"} '+s.apogeeKm));
  metric('rassvet_satellite_inclination_degrees','Orbital inclination in degrees.',
    satellites.map(s=>'{norad="'+s.id+'"} '+s.inclinationDeg));
  metric('rassvet_satellite_period_seconds','Orbital period in seconds.',
    satellites.map(s=>'{norad="'+s.id+'"} '+s.periodMin*60));
  return out.join('\n')+'\n';
}
