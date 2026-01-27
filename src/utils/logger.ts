// Utility logger that can be configured for production
const isDevelopment = __DEV__;

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args);
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};

// Helper to replace console.log with logger.log
export const createLogger = (context: string) => ({
  log: (...args: any[]) => logger.log(`[${context}]`, ...args),
  warn: (...args: any[]) => logger.warn(`[${context}]`, ...args),
  error: (...args: any[]) => logger.error(`[${context}]`, ...args),
  info: (...args: any[]) => logger.info(`[${context}]`, ...args),
  debug: (...args: any[]) => logger.debug(`[${context}]`, ...args),
}); 