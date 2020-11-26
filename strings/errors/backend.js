const codes = require('../../errors/backend');

const {w: t} = require('core/i18n');

module.exports = {
  [codes.NO_CLASS]: t('Class %class is not found'),
  [codes.NO_ROOT_CLASS]: t('Hierarchy root class was not passed'),
  [codes.NO_DEPS]: t('Necessary components were not passed.'),
  [codes.NO_ITEM]: t('Object could not be found'),
  [codes.NO_WF]: t('Workflow %wf is not found')
};
