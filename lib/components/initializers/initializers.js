'use strict';
let Initializer = require('esrol-initializer');

module.exports = class InitializersComponent {

  constructor(initializers, callback) {
    this._initializer = new Initializer();
    this._setCallback(callback);
    this._registerInitializers(initializers);
    this._instatinateComponents();
  }

  _onResolvedInitializers() {
    this._callback();
  }

  _registerInitializers(initializers) {
    if (!Object.keys(initializers).length) {
      return this._onResolvedInitializers();
    }
    for (let x in initializers) {
      this._initializer.registerComponent({
        priority: initializers[x].priority,
        component: initializers[x]
      });
    }
  }

  _setCallback(callback) {
    this._callback = callback;
    this._initializer.setCallback(() => { this._onResolvedInitializers() });
  }

  _instatinateComponents() {
    this._initializer.instantiateComponents();
  }

};
