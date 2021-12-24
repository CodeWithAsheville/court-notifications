const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize } = format;
const Transport = require('winston-transport');
const Rollbar = require('rollbar');

/*
    The primary purpose of this is to allow simple error logs to be sent to Rollbar
    Simply calling `logger.error(err)` will send the error to rollbar.
    Calling `logger.debug('message')` will write to the console.
*/

const rollbar = new Rollbar({
    accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
    captureUncaught: true,
    captureUnhandledRejections: true
});

/* Logging with level of error sends notification to Rollbar */
class rollbarTransport extends Transport {
    constructor(opts) {
      super(opts)
    }
    log(error, callback) {
        setImmediate(() => this.emit('logged', "rollbar"));
        rollbar.error(error.message)
    }
}

const logger = createLogger({
    format: combine(
        colorize(),
        timestamp(),
        printf(info =>  `${info.level}: ${info.timestamp} ${info.message}`)
    ),
    transports: [
        new transports.Console({level: 'debug'}),
        new rollbarTransport({level: 'error'})
    ]
})
logger.debug('Initializing logger.');
module.exports = {
  logger
}
