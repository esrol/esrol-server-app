'use strict';
let initializer;

module.exports = class Test {

  static get url() {
    return '/test';
  }

  static set initializer(value) {
    initializer = value;
  }

  static getMultipleRecords(req, res) {
    return res.end(initializer);
  }
};
