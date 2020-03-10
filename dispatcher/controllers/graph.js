/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 3/3/17.
 */
'use strict';

const moduleName = require('../../module-name');
const di = require('core/di');
const GraphTypes = require('../../lib/GraphTypes');
const dataConverter = require('../../backend/dataConverter');
const menu = require('../../backend/menu');

module.exports = function (req, res) {
  /**
   * @type {{graphMeta: GraphMetaRepository, metaRepo: MetaRepository, dataRepo: DataRepository}}
   */
  let scope = di.context(moduleName);
  if (!scope.graphMeta || !scope.metaRepo || !scope.dataRepo) {
    scope.sysLog.error('Не настроены компоненты модуля графов.');
    return res.sendStatus(500);
  }
  let meta = scope.graphMeta.getMeta(req.params.code);
  let template = 'graph';
  let converter = Promise.resolve({});

  if (meta.type === GraphTypes.WORKFLOW) {
    template = 'workflow';
    converter = dataConverter.workflow(meta, scope.metaRepo);
  } else if (meta.type === GraphTypes.HIERARCHY) {
    template = 'hierarchy';
    converter = dataConverter.hierarchy(res, meta, req.query, scope.metaRepo, scope.dataRepo);
  } else if (meta.type === GraphTypes.GRAPH) {
    converter = dataConverter.graph(res, meta, req.query, scope.metaRepo, scope.dataRepo);
  }
  converter
    .then(function (data) {
      let renderSettings = {
        baseUrl: req.app.locals.baseUrl,
        module: moduleName,
        title: meta.caption,
        leftMenu: menu.getLeft(),
        topMenu: menu.getTop(),
        data
      };
      res.render(template, renderSettings);
    })
    .catch(e => {scope.sysLog.error(e); res.sendStatus(500);});
};
