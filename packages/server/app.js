
const { logger } = require('./util/logger');
app = require('./server.js')

const port = process.env.PORT || 5000;

app.listen(port, () => logger.debug(`Listening on port ${port}`));
