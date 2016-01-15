/**
 * @author Ivaylo Ivanov
 * @public
 * @class App
 * @description An App Class for esrol-server-app.
 * Delegates tasks to esrol-server-app components:
 * 1) load config file
 * 2) load app modules
 * 3) resolve initializers
 * 4) create servers by passing the routes, middlewares and sockets as args
 * @requires fs
 * @requires path
 * @requires debug
 * @requires ./components/servers/servers
 * @requires ./components/initializers/initializers
 * @requires ./components/dependency/dependency
 */
'use strict';
const fs = require('fs');
const path = require('path');
const debug = require('debug')('esrol-server-app:app');
const ServersComponent = require('./components/servers/servers');
const InitializersComponent = require('./components/initializers/initializers');
const DependencyComponent = require('./components/dependency/dependency');
let wm = new WeakMap();

module.exports = class App {

  /**
   * @private
   * @method constructor
   * @description Call _runProcedure
   * @param {string} appPath - abs path to the application
   * @param {function} cb (optional) - callback function which will be called
   * on server(s) listening
   */
  constructor(appPath, cb) {
    this._runProcedure(appPath, cb);
  }

  /**
   * @private
   * @method _runProcedure
   * @description
   * 1) load config file
   * 2) load app modules
   * 3) resolve initializers
   * 4) create servers by passing the routes, middlewares and sockets as args
   * @param {string} appPath - abs path to the application
   * @param {function} cb (optional) - callback function which will be called
   * on server(s) listening
   * @throws {error} error - Project path was not passed as argument
   * to App class
   */
  _runProcedure(appPath, cb) {
    if (!appPath) {
      throw new Error('Project path was not passed as argument to App class');
    }
    if (typeof cb === 'function') {
      this._onReady = cb;
    }
    wm.config = this._includeConfigFile(appPath);
    wm.config.appPath = appPath;
    this._getDependenciesModules();
    this._resolveInitializers();
  }

  /**
   * @private
   * @method _includeConfigFile
   * @description Include and parse config.json
   * @param {string} appPath - abs path to the application
   * @returns {object} config - parsed config json
   * @throws {error} error - Config file is missing or corrupted
   * to App class
   */
  _includeConfigFile(appPath) {
    appPath = path.join(appPath, 'config', 'config.json');
    debug('including config from ' + appPath);
    try {
      return JSON.parse(fs.readFileSync(appPath));
    } catch (e) {
      throw new Error('Config file is missing or corrupted, error: '
      + e.toString());
    }
  }

  /**
   * @private
   * @method _runServersComponent
   * @description Creates enabled in config.json servers
   * @throws {error} error // if trown by ServersComponent
   */
  _runServersComponent() {
    debug('instatinating components');
    this._onReady = this._onReady.bind(this);
    new ServersComponent(
      wm.config,
      wm.routes,
      wm.sockets,
      wm.middlewares,
      this._onReady
    );
  }

  /**
   * @private
   * @method _onReady
   * @description Called on server(s) listening
   */
  _onReady() {
    debug('esrol-server-app is ready');
    console.log('Server(s) are running');
  }

  /**
   * @private
   * @method _resolveInitializers
   * @description Instantiate initializers if there is such and then call
   * _runServersComponent
   * @throws {error} error // if trown by InitializersComponent
   */
  _resolveInitializers() {
    if (!wm.initializers || !Object.keys(wm.initializers.app).length) {
      return this._runServersComponent();
    }
    debug('instatinating InitializersComponent');
    this._runServersComponent = this._runServersComponent.bind(this);
    new InitializersComponent(wm.initializers.app, this._runServersComponent);
  }

  /**
   * @private
   * @method _getDependenciesModules
   * @description Load dependency modules for app
   * (routes, sockets, middlewares, initializers) by calling DependencyComponent
   * @throws {error} error // if trown by DependencyComponent
   */
  _getDependenciesModules() {
    debug('getting dependencies');
    let dependencies = new DependencyComponent(wm.config.appPath);
    for (let x in dependencies) {
      wm[x] = dependencies[x];
    }
  }

};
