/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 3/14/17.
 */
'use strict';
const PropertyTypes = require('core/PropertyTypes');
const normalize = require('core/util/normalize');
const F = require('core/FunctionCodes');
const {renderTemplate} = require('../util');

// jshint maxparams: 10
function pushToSrc(className, id, value, src) {
  if (className && id && src) {
    let key = `${className}@${id}`;
    if (!src[key]) {
      src[key] = {className, value};
    }
  }
}

function srcContains(className, id, src) {
  if (className && id && src) {
    let key = `${className}@${id}`;
    if (src[key]) {
      return true;
    }
  }
  return false;
}

function pushToLinks(sourceClass, sourceId, targetClass, targetId, links) {
  if (sourceClass && sourceId && targetClass && targetId && links) {
    links.push({
      source: `${sourceClass}@${sourceId}`,
      target: `${targetClass}@${targetId}`
    });
  }
}

function loadItem(item, className, relations, src, links, namespace, metaRepo, dataRepo) {
  return new Promise(function (resolve, reject) {
    let cm = metaRepo.getMeta(className, null, namespace);
    if (!cm) {
      reject(new Error('Не найден класс ' + className));
    }
    let promises = [];
    if (!srcContains(className, item.getItemId(), src)) {
      pushToSrc(className, item.getItemId(), item, src);
    }
    if (Array.isArray(relations[className]) && relations[className].length) {
      relations[className].forEach(attr => {
        let pm = cm.getPropertyMeta(attr);
        if (pm && pm.type === PropertyTypes.REFERENCE) {
          let refId = item.get(attr);
          if (refId) {
            if (srcContains(pm.refClass, refId, src)) {
              pushToLinks(className, item.getItemId(), pm.refClass, refId, links);
            } else {
              let ref = item.getAggregate(attr);
              if (ref) {
                pushToSrc(pm.refClass, refId, ref, src);
                pushToLinks(className, item.getItemId(), pm.refClass, refId, links);
                if (Object.keys(relations).indexOf(pm.refClass) > -1) {
                  promises.push(loadItem(ref, pm.refClass, relations, src, links,
                    namespace, metaRepo, dataRepo));
                }
              } else {
                let rcm = metaRepo.getMeta(pm.refClass, null, namespace);
                if (rcm) {
                  promises.push(new Promise(function (resolve, reject) {
                    dataRepo.getItem(rcm.getCanonicalName(), refId)
                      .then(ri => {
                        if (ri) {
                          pushToSrc(pm.refClass, ri.getItemId(), ri, src);
                          pushToLinks(className, item.getItemId(), pm.refClass, ri.getItemId(), links);
                          if (Object.keys(relations).indexOf(pm.refClass) > -1) {
                            return loadItem(ri, pm.refClass, relations, src, links,
                              namespace, metaRepo, dataRepo);
                          }
                        }
                        return true;
                      })
                      .then(resolve)
                      .catch(reject);
                  }));
                }
              }
            }
          } else if (pm.backRef) {
            let rcm = metaRepo.getMeta(pm.refClass, null, namespace);
            if (rcm) {
              promises.push(new Promise(function (resolve, reject) {
                dataRepo.getList(rcm.getCanonicalName(), {filter: {[F.EQUAL]: ['$' + pm.backRef, item.getItemId()]}})
                  .then(list => {
                    if (Array.isArray(list) && list.length) {
                      pushToSrc(pm.refClass, list[0].getItemId(), list[0], src);
                      pushToLinks(className, item.getItemId(), pm.refClass, list[0].getItemId(), links);
                      if (Object.keys(relations).indexOf(pm.refClass) > -1) {
                        return loadItem(list[0], pm.refClass, relations, src, links,
                          namespace, metaRepo, dataRepo);
                      }
                    }
                    return true;
                  })
                  .then(resolve)
                  .catch(reject);
              }));
            }
          }
        } else if (pm && pm.type === PropertyTypes.COLLECTION) {
          promises.push(new Promise(function (resolve, reject) {
            dataRepo.getAssociationsList(item, attr)
              .then(colItems => {
                let p = [];
                if (Array.isArray(colItems) && colItems.length) {
                  colItems.forEach(ci => {
                    pushToSrc(pm.itemsClass, ci.getItemId(), ci, src);
                    pushToLinks(className, item.getItemId(), pm.itemsClass, ci.getItemId(), links);
                    if (Object.keys(relations).indexOf(pm.refClass) > -1) {
                      p.push(loadItem(ci, pm.itemsClass, relations, src, links,
                        namespace, metaRepo, dataRepo));
                    }
                  });
                }
                return Promise.all(p);
              })
              .then(resolve)
              .catch(reject);
          }));
        }
      });
    }
    return Promise.all(promises).then(resolve).catch(reject);
  });
}

/**
 *
 * @param {{}} res
 * @param {{rootClass: String, namespace: String, relations: {}}} graphMeta
 * @param {{}} query
 * @param {MetaRepository} metaRepo
 * @param {DataRepository} dataRepo
 * @return {Promise}
 */
module.exports = function (res, graphMeta, query, metaRepo, dataRepo) {
  if (!metaRepo || !dataRepo || !graphMeta) {
    return Promise.reject(new Error('Не переданы необходимые компоненты.'));
  }

  let root = query.root;
  let src = {};
  let nodes = [];
  let links = [];

  if (root) {
    let rootParts = root.split('@');
    let rootClass = rootParts[0];
    let rootId = rootParts[1];
    let cm = metaRepo.getMeta(rootClass, null, graphMeta.namespace);
    if (!cm) {
      return Promise.reject(new Error('Не найден класс ' + rootClass));
    }
    let renderPromises = [];
    let loader = rootId ? dataRepo.getItem(cm.getCanonicalName(), rootId) : dataRepo.getList(cm.getCanonicalName());
    return loader
      .then(result => {
        let promises = [];
        let items = result;
        if (!Array.isArray(result)) {
          items = [result];
        }
        items.forEach(item => {
          promises.push(loadItem(item, rootClass, graphMeta.relations,
            src, links, graphMeta.namespace, metaRepo, dataRepo));
        });
        return Promise.all(promises);
      })
      .then(() => {
        Object.keys(src).forEach(id => {
          let node = {id, name: src[id].value.toString(), data: normalize(src[id].value)};
          renderPromises.push(new Promise(function (resolve, reject) {
            renderTemplate(res, graphMeta, src[id].className, src[id].value)
              .then(html => {
                node.html = html;
                return renderTemplate(res, graphMeta, src[id].className, src[id].value, 'tooltip');
              })
              .then(tooltip => {
                node.tooltip = tooltip;
                resolve();
              })
              .catch(reject);
          }));
          nodes.push(node);
        });
        return Promise.all(renderPromises);
      })
      .then(() => ({nodes, links}));
  } else {
    return Promise.resolve({node: [], links: []});
  }
};
