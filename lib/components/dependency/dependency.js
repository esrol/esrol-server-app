/**
 * @author Ivaylo Ivanov
 * @private
 * @class Dependency
 * @description Include all app files
 * @requires fs
 * @requires path
 * @requires esrol-autoloader
 * @requires debug
 */
'use strict';
let fs = require('fs');
let path = require('path');
let Autoloader = require('esrol-autoloader');
let debug = require('debug')('esrol-server-app:components:dependency');

module.exports = class Dependency {

  /**
   * @private
   * @method constructor
   * @description Call
   * 1) _includeInitializers
   * 2) _includeHttpRoutes
   * 3) _includeHttpsRoutes
   * 4) _includeMiddlewares
   * 5) _includeSockets
   * synchronously
   * @param {string} appPath - abs path to the application
   * @returns {object} app - app object holding all files as object and their
   * namespaces as array
   * @throws {error} error // if thrown by esrol-autoloader
   */
  constructor(appPath) {
    return {
      initializers: this._includeInitializers(appPath),
      routes: {
        httpRoutes: this._includeHttpRoutes(appPath),
        httpsRoutes: this._includeHttpsRoutes(appPath)
      },
      middlewares: this._includeMiddlewares(appPath),
      sockets: this._includeSockets(appPath)
    };
  }

  /**
   * @private
   * @method _includeHttpRoutes
   * @description Include http routes synchronously
   * @param {string} appPath - abs path to the application
   * @returns {object} app - app object holding all files as object and their
   * namespaces as array
   * @throws {error} error // if thrown by esrol-autoloader
   */
  _includeHttpRoutes(appPath) {
    debug('including http routes');
    let routesPath = path.join(appPath, 'routes');
    let httpRoutesPath = path.join(routesPath, 'http-routes');
    let settings = {
      getNamespaces: true,
      getAsObject: true,
      path: httpRoutesPath
    };
    if (!fs.existsSync(routesPath) || !fs.existsSync(httpRoutesPath)) {
      return;
    }
    return new Autoloader(settings);
  }

  /**
   * @private
   * @method _includeHttpsRoutes
   * @description Include https routes synchronously
   * @param {string} appPath - abs path to the application
   * @returns {object} app - app object holding all files as object and their
   * namespaces as array
   * @throws {error} error // if thrown by esrol-autoloader
   */
  _includeHttpsRoutes(appPath) {
    debug('including https routes');
    let routesPath = path.join(appPath, 'routes');
    let httpsRoutesPath = path.join(routesPath, 'https-routes');
    let settings = {
      getNamespaces: true,
      getAsObject: true,
      path: httpsRoutesPath
    };
    if (!fs.existsSync(routesPath) || !fs.existsSync(httpsRoutesPath)) {
      return;
    }
    return new Autoloader(settings);
  }

  /**
   * @private
   * @method _includeInitializers
   * @description Include initializers synchronously
   * @param {string} appPath - abs path to the application
   * @returns {object} app - app object holding all files as object and their
   * namespaces as array
   * @throws {error} error // if thrown by esrol-autoloader
   */
  _includeInitializers(appPath) {
    debug('including initializers');
    let settings = {
      getNamespaces: false,
      getAsObject: true,
      path: path.join(appPath, 'initializers')
    };
    if (!fs.existsSync(settings.path)) {
      return;
    }
    return new Autoloader(settings);
  }

  /**
   * @private
   * @method _includeSockets
   * @description Include sockets synchronously
   * @param {string} appPath - abs path to the application
   * @returns {object} app - app object holding all files as object and their
   * namespaces as array
   * @throws {error} error // if thrown by esrol-autoloader
   */
  _includeSockets(appPath) {
    debug('including sockets');
    let settings = {
      getNamespaces: false,
      getAsObject: true,
      path: path.join(appPath, 'sockets')
    };
    if (!fs.existsSync(settings.path)) {
      return;
    }
    return new Autoloader(settings);
  }

  /**
   * @private
   * @method _includeMiddlewares
   * @description Include middlewares synchronously
   * @param {string} appPath - abs path to the application
   * @returns {object} app - app object holding all files as object and their
   * namespaces as array
   * @throws {error} error // if thrown by esrol-autoloader
   */
  _includeMiddlewares(appPath) {
    debug('including middlewares');
    let settings = {
      getNamespaces: false,
      getAsObject: true,
      path: path.join(appPath, 'middlewares')
    };
    if (!fs.existsSync(settings.path)) {
      return {
        app: {},
        namespaces: []
      };
    }
    return new Autoloader(settings);
  }

};
