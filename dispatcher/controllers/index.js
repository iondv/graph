/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 3/3/17.
 */
'use strict';

const moduleName = require('../../module-name');
const di = require('core/di');
const GraphTypes = require('../../lib/GraphTypes');
const menu = require('../../backend/menu');

module.exports = function (req, res) {
  res.render('index', {
    module: moduleName,
    baseUrl: req.app.locals.baseUrl,
    leftMenu: menu.getLeft(),
    topMenu: menu.getTop()
  });
};
