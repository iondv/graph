/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 3/10/17.
 */
const GraphMetaRepository = require('../interfaces/GraphMetaRepository');
const IonError = require('core/IonError');
const Errors = require('../../errors/lib');

/**
 *
 * @param {{}} options
 * @param {DataSource} options.dataSource
 * @param {String} [options.metaTableName]
 * @constructor
 */
function DsGraphMetarepository(options) {

  if (!options.dataSource) {
    throw new IonError(Errors.NO_DS);
  }

  /**
   *
   * @type {DataSource}
   */
  var ds = this.dataSource = options.dataSource;

  var metaTableName = this.metaTableName = options.metaTableName || 'ion_graph_meta';

  var meta = {};

  /**
   *
   * @return {Promise}
   */
  this._init = function () {
    return new Promise(function (resolve, reject) {
      meta = {};

      ds.ensureIndex(metaTableName, [{code: 1}], {unique: true})
        .then(() => ds.fetch(metaTableName))
        .then(function (foundMeta) {
          if (Array.isArray(foundMeta) && foundMeta.length) {
            foundMeta.forEach(m => {meta[m.code] = m;});
          }
          resolve();
        })
        .catch(reject);
    });
  };

  /**
   * @returns {Object[]}
   */
  this._listMeta = function () {
    let result = [];
    Object.keys(meta).forEach(code => result.push(meta[code]));
    return result;
  };

  /**
   * @param {String} code
   * @returns {Object | null}
   */
  this.getMeta = function (code) {
    if (meta.hasOwnProperty(code)) {
      return meta[code];
    }
    return null;
  };

}
DsGraphMetarepository.prototype = new GraphMetaRepository();
module.exports = DsGraphMetarepository;
