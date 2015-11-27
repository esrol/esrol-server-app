'use strict';
let Initializer = require('esrol-initializer');

module.exports = class InitializersComponent {

  constructor(initializers, callback) {
    this._initializer = new Initializer();
    this._registerInitializers(initializers);
    this._setCallback(callback);
    this._instatinateComponents();
  }

  _registerInitializers(initializers) {
    for (let x in initializers) {
      this._initializer.registerComponent({
        priority: initializers[x].priority,
        component: initializers[x]
      });
    }
  }

  _setCallback(callback) {
    this._initializer.setCallback(callback);
  }

  _instatinateComponents() {
    this._initializer.instantiateComponents();
  }
};
