const codes = require('../../../errors/lib');

module.exports = {
  [codes.WRONG_FILE]: 'Не удалось прочитать содержимое файла %file',
  [codes.NO_DS]: 'не указан источник данных репозитория мета-данных портала'
};
