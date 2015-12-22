'use strict';
module.exports = class Test {

  static get url() {
    return '/test';
  }

  static getMultipleRecords(req, res) {
    return res.end(req.middleware);
  }
};
