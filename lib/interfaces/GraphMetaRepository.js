/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 3/10/17.
 */
'use strict';

function GraphMetaRepository() {

  /**
   *
   * @return {Promise}
   */
  this.init = function () {
    return this._init();
  };

  /**
   * @returns {Object[]}
   */
  this.listMeta = function () {
    return this._listMeta();
  };

  /**
   * @param {String} code
   * @returns {Object | null}
   */
  this.getMeta = function (code) {
    return this._getMeta(code);
  };
}

module.exports = GraphMetaRepository;
