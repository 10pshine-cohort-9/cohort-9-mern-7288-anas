import pino from 'pino';

// Configure Pino to use pino-pretty for clean local terminal output
const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname', // Cleans up the terminal output
    },
  },
});

export default logger;