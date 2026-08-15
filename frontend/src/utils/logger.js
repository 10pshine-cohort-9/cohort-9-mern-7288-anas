import pino from 'pino';

const logger = pino({
    level: import.meta.env.DEV ? 'debug' : 'error',
    browser: {
        asObject: false,
    }
});

export default logger;