/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 3/14/17.
 */
'use strict';

const moduleName = require('../module-name');

module.exports.renderTemplate = function (res, graphMeta, className, item, property = 'template') {
  return new Promise(function (resolve, reject) {
    let template;
    if (graphMeta[property]) {
      if (typeof graphMeta[property] === 'string') {
        template = graphMeta[property];
      } else {
        if (graphMeta[property].hasOwnProperty(className)) {
          template = graphMeta[property][className];
        } else if (graphMeta[property].default) {
          template = graphMeta[property].default;
        }
      }
    }
    if (!template) {
      return resolve(null);
    }
    res.render(template, {cache: true, module: moduleName, item}, (err, html) => {
      if (err) {
        console.log(err);
      }
      resolve(err ? null : html);
    });
  });
};
