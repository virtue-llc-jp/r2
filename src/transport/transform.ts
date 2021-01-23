import { EOL } from 'os';
import * as split from 'split2';
import * as Parse from 'fast-json-parse';
import * as chalk  from 'chalk';
import { format as formatDate } from 'date-fns';

interface LogObject {
  level: number;
  msg: string;
  time: number;
  label: string;
  hidden: boolean;
}

const dateFormat = 'yyyy-MM-dd HH:mm:ss.SSS';

const levels = {
  default: 'USERLVL',
  60: 'FATAL',
  50: 'ERROR',
  40: 'WARN',
  30: 'INFO',
  20: 'DEBUG',
  10: 'TRACE'
};

export interface PrettyOpts {
  colorize: boolean;
  withLabel: boolean;
  debug: boolean;
  info: boolean;
  hidden: boolean;
}
export function pretty(opts: PrettyOpts) {
  const { colorize, withLabel, debug, info, hidden } = opts;
  const ctx = new chalk.Instance({
    level: colorize ? chalk.supportsColor ? chalk.supportsColor.level : 0 : 0
  });
  const levelColors = {
    default: ctx.white,
    60: ctx.bgRed,
    50: ctx.red,
    40: ctx.yellow,
    30: ctx.green,
    20: ctx.blue,
    10: ctx.grey
  };
  const stream = split((json: string): string => {
    try {
      const parsed = new Parse(json);
      const logObj: LogObject = parsed.value;
      if (parsed.err) {
        return json + EOL;
      }
      if (!debug && logObj.level <= 20) {
        return '';
      }
      if (!info && logObj.level <= 30) {
        return '';
      }
      if (hidden && logObj.hidden) {
        return '';
      }
      const dateString = formatDate(new Date(logObj.time), dateFormat);
      const levelString = levelColors[logObj.level](levels[logObj.level]);
      const labelString = withLabel ? `[${logObj.label}] ` : '';
      return `${dateString} ${levelString} ${labelString}${logObj.msg}${EOL}`;
    } catch (ex) {
      // return '';
      return ex.toString();
    }
  });
  return stream;
}

export function splitToJson() {
  const stream = split((json: string): string => {
    try {
      const parsed = new Parse(json);
      const logObj: LogObject = parsed.value;
      if (parsed.err) {
        return json + EOL;
      }
      if (logObj.level <= 20 || logObj.hidden) {
        return '';
      }
      return JSON.stringify({
        time: logObj.time,
        level: levels[logObj.level],
        msg: `[${logObj.label}] ${logObj.msg}`
      });
    } catch (ex) {
      return '';
    }
  });
  return stream;
}
