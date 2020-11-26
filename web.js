/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 3/3/17.
 */

const path = require('path');
const express = require('express');
const di = require('core/di');
const {load} = require('core/i18n');
const errorSetup = require('core/error-setup');
const config = require('./config');
const rootConfig = require('../../config');
const moduleName = require('./module-name');
const dispatcher = require('./dispatcher');
const extendDi = require('core/extendModuleDi');
const ejsLocals = require('ejs-locals');
const theme = require('lib/util/theme');
const staticRouter = require('lib/util/staticRouter');
const extViews = require('lib/util/extViews');

errorSetup(path.join(__dirname, 'strings'));

var app = module.exports = express();
var router = express.Router();

router.get('/', dispatcher.index);
router.get('/:code', dispatcher.graph);

app.locals.sysTitle = config.sysTitle;
app.locals.staticsSuffix = process.env.ION_ENV === 'production' ? '.min' : '';

app.engine('ejs', ejsLocals);
app.set('view engine', 'ejs');

app._init = function () {
  return load(path.join(__dirname, 'i18n'))
  .then(
    () => di(
      moduleName,
      extendDi(moduleName, config.di),
      {module: app},
      'app',
      [],
      'modules/' + moduleName
	)
  ).then(function (scope) {
    // i18n
    const lang = config.lang || rootConfig.lang || 'ru';
    const i18nDir = path.join(__dirname, 'i18n');
    // scope.translate.setup(lang, config.i18n || i18nDir, moduleName); // scope.translate is undefined
    let themePath = scope.settings.get(moduleName + '.theme') || config.theme || 'default';
    themePath = theme.resolve(__dirname, themePath);
    const themeI18n = path.join(themePath, 'i18n');
    // scope.translate.setup(lang, themeI18n, moduleName); // scope.translate is undefined
    //
    theme(
      app,
      moduleName,
      __dirname,
      themePath,
      scope.sysLog
    );
    extViews(app, scope.settings.get(moduleName + '.templates'));
    var statics = staticRouter(scope.settings.get(moduleName + '.statics'));
    if (statics) {
      app.use('/' + moduleName, statics);
    }
    app.use('/' + moduleName, router);
  });
};
