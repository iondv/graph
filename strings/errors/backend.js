const codes = require('../../errors/backend');

const {w: t} = require('core/i18n');

module.exports = {
  [codes.NO_CLASS]: t('Не найден класс %class'),
  [codes.NO_ROOT_CLASS]: t('Не передан начальный класс иерархии'),
  [codes.NO_DEPS]: t('Не переданы необходимые компоненты.'),
  [codes.NO_ITEM]: t('не найден объект'),
  [codes.NO_WF]: t('Не найден бизнес-процесс %wf')
};
