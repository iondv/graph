const codes = require('../../errors/lib');

const {w: t} = require('core/i18n');

module.exports = {
  [codes.WRONG_FILE]: t('Не удалось прочитать содержимое файла %file'),
  [codes.NO_DS]: t('не указан источник данных репозитория мета-данных портала')
};
