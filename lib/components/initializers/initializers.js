/**
 * @author Ivaylo Ivanov
 * @private
 * @class Initializer
 * @description Register, instantiate and resolve initializers
 * @requires esrol-initializer
 */
'use strict';
const Initializer = require('esrol-initializer');

module.exports = class InitializersComponent {

  /**
   * @private
   * @method constructor
   * @description Set callback, register, instantiate and resolve initializers
   * @param {object} initializers - classes positioned in app/initializers/
   * @param {function} cb - callback function which will be called
   * when initializers are resolved
   */
  constructor(initializers, callback) {
    this._initializer = new Initializer();
    this._setCallback(callback);
    this._registerInitializers(initializers);
    this._instantiateInitializers();
  }

  /**
   * @private
   * @method _onResolvedInitializers
   * @description Call _callback
   */
  _onResolvedInitializers() {
    this._callback();
  }

  /**
   * @private
   * @method _registerInitializers
   * @description Iterate and register an initializer
   * @param {object} initializers - classes positioned in app/initializers/
   * @throws{error} error // thrown by esrol-initializer if the
   * initializer is not constructed correctly
   */
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

  /**
   * @private
   * @method _setCallback
   * @description Set a callback function when all done.
   * @param {function} cb - callback function which will be called
   * when initializers are resolved
   */
  _setCallback(callback) {
    this._callback = callback;
    this._initializer.setCallback(() => {
      this._onResolvedInitializers();
    });
  }

  /**
   * @private
   * @method _instantiateInitializers
   * @description Instantiate initializers.
   */
  _instantiateInitializers() {
    this._initializer.instantiateComponents();
  }

};
