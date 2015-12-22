'use strict';
module.exports = class Middleware {

  static get priority() {
    return 1;
  }

  static onRequest(req, res, next) {
    req.middleware = 'middleware';
    next();
  }

};
