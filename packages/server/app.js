const { logger } = require('./util/logger');
const app = require('./server');

const port = process.env.PORT || 5000;

app.listen(port, () => logger.debug(`Listening on port ${port}`));
