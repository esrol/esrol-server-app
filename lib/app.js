'use strict';
let fs = require('fs');
let path = require('path');
let debug = require('debug')('esrol-server-app:app');
let ServersComponent = require('./components/servers/servers');
let InitializersComponent = require('./components/initializers/initializers');
let DependencyComponent = require('./components/dependency/dependency');
let wm = new WeakMap();

module.exports = class App {

  constructor(appPath, cb) {
    this._runProcedure(appPath, cb);
  }

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

  _onResolvedInitializers() {
    this._componentsTrigger();
  }

  _componentsTrigger() {
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

  _onReady() {
    debug('esrol-server-app is ready');
    console.log('Server(s) are running');
  }

  _resolveInitializers() {
    if (!wm.initializers || !Object.keys(wm.initializers.app).length) {
      return this._onResolvedInitializers();
    }
    debug('instatinating InitializersComponent');
    this._onResolvedInitializers = this._onResolvedInitializers.bind(this);
    new InitializersComponent(wm.initializers.app, this._onResolvedInitializers);
  }

  _getDependenciesModules() {
    debug('getting dependencies');
    let dependencies = new DependencyComponent(wm.config.appPath);
    for (let x in dependencies) {
      wm[x] = dependencies[x];
    }
  }

};
