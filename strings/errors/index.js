const merge = require('merge');

module.exports = merge(
  require('./backend'),
  require('./lib')
);
