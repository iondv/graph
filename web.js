/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 3/3/17.
 */

const express = require('express');
const di = require('core/di');
const config = require('./config');
const moduleName = require('./module-name');
const dispatcher = require('./dispatcher');
const extendDi = require('core/extendModuleDi');
const ejsLocals = require('ejs-locals');
const theme = require('lib/util/theme');
const staticRouter = require('lib/util/staticRouter');
const extViews = require('lib/util/extViews');

var app = module.exports = express();
var router = express.Router();

router.get('/', dispatcher.index);
router.get('/:code', dispatcher.graph);

app.locals.sysTitle = config.sysTitle;
app.locals.staticsSuffix = process.env.ION_ENV === 'production' ? '.min' : '';

app.engine('ejs', ejsLocals);
app.set('view engine', 'ejs');

app._init = function () {
  return di(
    moduleName,
    extendDi(moduleName, config.di),
    {module: app},
    'app',
    [],
    'modules/' + moduleName
  ).then(function (scope) {
    theme(
      app,
      moduleName,
      __dirname,
      scope.settings.get(moduleName + '.theme') ||
      config.theme || 'default',
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
