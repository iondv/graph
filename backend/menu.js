'use strict';

const moduleName = require('../module-name');
const di = require('core/di');
const GraphTypes = require('../lib/GraphTypes');

exports.getLeft = function () {
  const scope = di.context(moduleName);
  if (!scope.graphMeta) {
    scope.sysLog.error('Не настроены компоненты модуля графов.');
    return [];
  }
  let items = [];
  scope.graphMeta.listMeta();
  for (let data of scope.graphMeta.listMeta()) {
    let item = {
      code: data.code,
      caption: data.caption,
      url: `${moduleName}/${data.code}`
    };
    switch (data.type) {
      case GraphTypes.GRAPH: {
        Object.keys(data.relations).forEach(className => {
          items.push({
            caption: `${item.caption}[${className}]`,
            url: `${item.url}?root=${className}`
          });
        });
      } break;
      default:
        items.push(item);
        break;
    }
  }
  return items;
};

exports.getTop = function () {
  return [];
};