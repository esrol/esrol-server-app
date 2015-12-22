'use strict';
let TestRoute = require('../routes/http-routes/test');
module.exports = class Initializer {

  constructor() {
    TestRoute.initializer = 'initializer';
  }

  static get priority() {
    return 1;
  }

};
