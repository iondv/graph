/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 2/13/17.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const di = require('core/di');
const config = require('../config');
const moduleName = require('../module-name');
const resolvePath = require('core/resolvePath');
const F = require('core/FunctionCodes');
const __ = require('core/strings').unprefix('i18n');
const IonError = require('core/IonError');
const Errors = require('../errors/lib');

/**
 * @param {Logger} log
 * @param {String} msg
 */
function info(log, msg) {
  if (log) {
    log.log(msg);
  } else {
    console.log(msg);
  }
}

/**
 * @param {Logger} log
 * @param {String} msg
 */
function warn(log, msg) {
  if (log) {
    log.warn(msg);
  } else {
    console.warn(msg);
  }
}

/**
 * @param {String} filePath
 * @param {String} namespace
 * @param {DataSource} dataSource
 * @param {String} tableName
 * @param {Logger} log
 * @returns {Promise}
 */
function metaLoader(filePath, namespace, dataSource, tableName, log) {
  return new Promise(function (resolve, reject) {
    fs.readFile(filePath, {encoding: 'utf-8'}, function (err, data) {
      if (err) {
        return reject(new IonError(Errors.WRONG_FILE, {file: filePath}));
      }
      try {
        var n = JSON.parse(data);
        n.namespace = namespace;
        info(log, __('Мета графов %code будет записана в БД.', {code: n.code}));
        dataSource.upsert(tableName, {[F.EQUAL]: ['$code', n.code]}, n).then(resolve).catch(reject);
      } catch (err) {
        reject(err);
      }
    });
  });
}

/**
 * @param {String} src
 * @param {String} namespace
 * @param {DataSource} dataSource
 * @param {String} tableName
 * @param {Logger} log
 * @returns {*}
 */
function loader(src, namespace, dataSource, tableName, log) {
  return new Promise(function (resolve, reject) {
    var d = path.join(src, 'meta');
    fs.access(d, fs.R_OK, function (err) {
      if (!err) {
        fs.readdir(d, function (err, files) {
          var savers = [];
          for (var i = 0; i < files.length; i++) {
            savers.push(metaLoader(path.join(d, files[i]), namespace, dataSource, tableName, log));
          }
          Promise.all(savers).then(resolve).catch(reject);
        });
      } else {
        warn(log, __('Не удалось прочитать директорию меты модуля графов %src', {src}));
        resolve();
      }
    });
  });
}

module.exports = function (src, namespace) {
  return new Promise(function (resolve, reject) {
    di(
      moduleName,
      config.di,
      {},
      'app',
      [],
      'modules/' + moduleName
    ).then(
      function (scope) {
        var pth = resolvePath(src);
        info(scope.sysLog, __('Импорт меты модуля графов из %pth', {pth}));
        return loader(pth, namespace, scope.graphMeta.dataSource, scope.graphMeta.metaTableName, scope.sysLog);
      }
    ).then(resolve).catch(reject);
  });
};
