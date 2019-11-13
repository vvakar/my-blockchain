const api = require('./api');

const BC_PORT = process.argv[2];
api(BC_PORT);