'use strict';
let api = new WeakMap();
let Servers = require('esrol-servers');

module.exports = {

  getHttpServer: function() {
    return Servers.getHttpServerInstance();
  },

  get: function(key) {
    return api[key];
  },

  set: function(propery, value) {
    api[propery] = value;
  }

};
