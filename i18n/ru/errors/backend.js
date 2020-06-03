const codes = require('../../../errors/backend');

module.exports = {
  [codes.NO_CLASS]: 'Не найден класс %class',
  [codes.NO_ROOT_CLASS]: 'Не передан начальный класс иерархии',
  [codes.NO_DEPS]: 'Не переданы необходимые компоненты.',
  [codes.NO_ITEM]: 'не найден объект',
  [codes.NO_WF]: 'Не найден бизнес-процесс %wf'
};
