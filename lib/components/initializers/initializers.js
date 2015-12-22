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
    for (let x in initializers) {
      try {
        this._initializer.registerComponent({
          priority: initializers[x].priority,
          component: initializers[x]
        });
      } catch (e) {
        let error = {
          error: 'Initializer must be a class with a static "priority" property',
          originalError: e,
          stack: e.stack
        };
        throw new Error(JSON.stringify(error, null, 2));
      }
    }
  }

  _setCallback(callback) {
    this._callback = callback;
    this._initializer.setCallback(() => {
      this._onResolvedInitializers();
    });
  }

  _instatinateComponents() {
    this._initializer.instantiateComponents();
  }

};
