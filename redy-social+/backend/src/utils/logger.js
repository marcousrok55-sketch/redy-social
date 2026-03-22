const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

const colorize = (level) => {
  const colors = {
    error: '\x1b[31m',
    warn: '\x1b[33m',
    info: '\x1b[36m',
    http: '\x1b[35m',
    debug: '\x1b[32m',
    reset: '\x1b[0m',
  };
  return `${colors[level] || colors.info}${level.toUpperCase()}${colors.reset}`;
};

class Logger {
  constructor() {
    this.level = level();
  }

  log(level, ...args) {
    if (levels[level] <= levels[this.level]) {
      const timestamp = new Date().toISOString();
      console.log(`${timestamp} ${colorize(level)}`, ...args);
    }
  }

  error(...args) {
    this.log('error', ...args);
  }

  warn(...args) {
    this.log('warn', ...args);
  }

  info(...args) {
    this.log('info', ...args);
  }

  http(...args) {
    this.log('http', ...args);
  }

  debug(...args) {
    this.log('debug', ...args);
  }
}

export default new Logger();
