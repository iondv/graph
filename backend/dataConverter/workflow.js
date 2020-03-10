/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 3/14/17.
 */
'use strict';

/**
 *
 * @param {{wfClass:String, wfName: String, namespace: String, relations: {}}} graphMeta
 * @param {MetaRepository} metaRepo
 */
module.exports = function (graphMeta, metaRepo) {
  if (!metaRepo || !graphMeta) {
    return Promise.reject(new Error('Не переданы необходимые компоненты'));
  }

  let wf = metaRepo.getWorkflow(graphMeta.wfClass, graphMeta.wfName, graphMeta.namespace);
  if (!wf) {
    return Promise.reject(new Error('Не найден бизнес-процесс ' + graphMeta.wfName));
  }

  let nodes = [];
  let links = [];

  if (Array.isArray(wf.states) && wf.states.length) {
    wf.states.forEach(s => nodes.push({id: s.name, name: s.caption, data: s}));
  }
  if (Array.isArray(wf.transitions) && wf.transitions.length) {
    wf.transitions.forEach(t => links.push({source: t.startState, target: t.finishState, data: t}));
  }

  return Promise.resolve({nodes, links, startState: wf.startState});
};
