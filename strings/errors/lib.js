const codes = require('../../errors/lib');

const {w: t} = require('core/i18n');

module.exports = {
  [codes.WRONG_FILE]: t('File %file could not be read'),
  [codes.NO_DS]: t('Data source for portal metadata is not set')
};
