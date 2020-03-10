/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 3/7/17.
 */
'use strict';
const cast = require('core/cast');
const {renderTemplate} = require('../util');
const F = require('core/FunctionCodes');

// jshint maxstatements: 30, maxcomplexity: 20

function findRelations(classMetas, containerClass) {
  let result = [];
  if (Array.isArray(classMetas) && classMetas.length) {
    classMetas.forEach(function (cm) {
      if (cm.getContainerReference()) {
        let pm = cm.getPropertyMeta(cm.getContainerReference());
        if (pm && pm.refClass === containerClass) {
          result.push({
            className: cm.getName(),
            property: pm.name,
            children: findRelations(classMetas, cm.getName())
          });
        }
      }
      let desc = findRelations(cm.getDescendants(), containerClass);
      if (Array.isArray(desc) && desc.length) {
        result.push(...desc);
      }
    });
  }
  return result;
}

function castIds(ids, className, namespace, metaRepo) {
  let result = [];
  let cm = metaRepo.getMeta(className, null, namespace);
  if (cm) {
    if (cm.getKeyProperties().length === 1) {
      var pn = cm.getKeyProperties()[0];
      var kp = cm.getPropertyMeta(pn);
      ids.forEach(id => result.push(cast(id, kp.type)));
    } else {
      result.push(...ids);
    }
  }
  return result;
}

function findChildren(containers, relations, namespace, metaRepo, dataRepo) {
  let promises = Promise.resolve();
  let parents = {};
  containers.forEach(c => {
    if (!parents[c.className]) {
      parents[c.className] = [];
    }
    parents[c.className].push(c.id);
  });
  relations.forEach(r => {
    if (parents[r.className]) {
      if (Array.isArray(r.children) && r.children.length) {
        r.children.forEach(childClass => {
          promises = promises.then(() => {
            let cm = metaRepo.getMeta(childClass.className, null, namespace);
            let ids = castIds(parents[r.className], r.className, namespace, metaRepo);
            let filter = {[F.IN]: ['$' + childClass.property, ids]};
            return dataRepo.getList(cm.getCanonicalName(), {filter})
              .then((items) => {
                if (!items || !items.length) {
                  return;
                }
                items.forEach((item) => {
                  let parentId = item.get(childClass.property);
                  containers.forEach(c => {
                    let child = {
                      item,
                      id: item.getItemId(),
                      className: item.getMetaClass().getName(),
                      name: item.toString(),
                      children: []
                    };
                    if (r.className === c.className && parentId == c.id) { // jshint ignore:line
                      c.children.push(child);
                    }
                  });
                });
              });
          });
        });
      }
    }
  });
  return promises
    .then(() => {
      let nextContainers = [];
      let nextRelations = [];
      containers.forEach(c => nextContainers.push(...c.children));
      if (!nextContainers.length) {
        return Promise.resolve();
      }
      relations.forEach(r => nextRelations.push(...r.children));
      return findChildren(nextContainers, nextRelations, namespace, metaRepo, dataRepo);
    });
}

function forEachNode(hierarchy, cb) {
  cb(hierarchy);
  if (hierarchy.children) {
    hierarchy.children.forEach(node => {
      cb(node);
      forEachNode(node, cb);
    });
  }
}

/**
 *
 * @param {{}} res
 * @param {{rootClass: String, namespace: String, relations: {}}} graphMeta
 * @param {{}} query
 * @param {MetaRepository} metaRepo
 * @param {DataRepository} dataRepo
 */
module.exports = function (res, graphMeta, query, metaRepo, dataRepo) {
  if (!metaRepo || !dataRepo || !graphMeta) {
    return Promise.reject(new Error('Не переданы необходимые компоненты'));
  }

  let rootId = null;
  let className = query.root || graphMeta.rootClass || graphMeta.relations.className;
  let rootParts = className.split('@');
  if (rootParts.length > 1) {
    className = rootParts[0];
    rootId = rootParts[1];
  }

  if (!className) {
    return Promise.reject(new Error('Не передан начальный класс иерархии'));
  }

  let cm = metaRepo.getMeta(className, null, graphMeta.namespace);
  if (!cm) {
    return Promise.reject(new Error('Не найден класс ' + className));
  }

  let relations = graphMeta.relations;
  if (!relations) {
    let metas = metaRepo.listMeta(null, null, false, cm.getNamespace());
    relations = {
      className: cm.getName(),
      children: findRelations(metas, cm.getName())
    };
  }

  let hierarchy = {
    name: cm.getCaption(),
    children: []
  };

  let rootsGetter;
  if (rootId) {
    hierarchy.id = rootId;
    hierarchy.className = className;
    rootsGetter = dataRepo.getItem(cm.getCanonicalName(), rootId)
      .then(rootItem => {
        if (!rootItem) {
          throw new Error('не найден объект');
        }
        hierarchy.item = rootItem;
        return findChildren([hierarchy], [relations], cm.getNamespace(), metaRepo, dataRepo);
      });
  } else {
    rootsGetter = dataRepo.getList(cm.getCanonicalName())
      .then(function (roots) {
        if (roots && roots.length) {
          roots.forEach(function (root) {
            hierarchy.children.push({
              id: root.getItemId(),
              className: cm.getName(),
              name: root.toString(),
              item: root,
              children: []
            });
          });
        }
        return findChildren(hierarchy.children, [relations], cm.getNamespace(), metaRepo, dataRepo);
      });
  }

  return rootsGetter
    .then(() => {
      let renderPromises = [];
      forEachNode(hierarchy, node => {
        renderPromises.push(new Promise(function (resolve, reject) {
          renderTemplate(res, graphMeta, node.className, node.item)
            .then(html => {
              node.html = html;
              return renderTemplate(res, graphMeta, node.className, node.item, 'tooltip');
            })
            .then(tooltip => {
              node.tooltip = tooltip;
              delete node.item;
              resolve();
            })
            .catch(reject);
        }));
      });
      return Promise.all(renderPromises);
    })
    .then(() => hierarchy);
};