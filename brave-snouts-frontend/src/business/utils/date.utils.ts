import { CountdownFormatFnOption } from 'ngx-countdown';

const CountdownTimeUnits: Array<[string, number]> = [
    ['YY', 1000 * 60 * 60 * 24 * 365], // years
    ['MM', 1000 * 60 * 60 * 24 * 30], // months
    ['DD', 1000 * 60 * 60 * 24], // days
    ['HH', 1000 * 60 * 60], // hours
    ['mm', 1000 * 60], // minutes
    ['ss', 1000], // seconds
    ['S', 1] // million seconds
  ];
  
export function formatDateToHoursOnlyNgxCountdown(opt: CountdownFormatFnOption): string {
    
    let { date, formatStr, timezone } = opt;

    let duration = Number(date || 0);
  
    return CountdownTimeUnits.reduce((current, [name, unit]) => {

      if(current.indexOf(name) === -1) return current;
        
      const v = Math.floor(duration / unit);
      duration -= v * unit;

      return current.replace(new RegExp(`${name}`), (match: string) => {
        
        return v.toString().padStart(match.length, '0');
      });

    }, formatStr);

  };