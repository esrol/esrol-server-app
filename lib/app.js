'use strict';
let fs = require('fs');
let path = require('path');
let LoggerComponent = require('./components/logger/logger');
let ServersComponent = require('./components/servers/servers');
let InitializersComponent = require('./components/initializers/initializers');
let ApiComponent = require('./components/api/api');
let DependencyComponent = require('./components/dependency/dependency');
let wm = new WeakMap();

class App {

  constructor(appPath) {
    this._runProcedure(appPath);
  }

  _runProcedure(appPath) {
    if (!appPath) {
      throw new Error('Project path was not passed as argument to App class');
    }
    wm.config = this._includeConfigFile(appPath);
    wm.config.appPath = appPath;
    this._getDependenciesModules();
    this._resolveInitializers();
  }

  _includeConfigFile(appPath) {
    appPath = path.join(appPath, 'config', 'config.json');
    try {
      return JSON.parse(fs.readFileSync(appPath));
    } catch(e) {
      throw new Error('Config file is missing or corrupted, error: ' + e.toString());
    }
  }

  _onResolvedInitializers() {
    this._componentsTrigger();
  }

  _componentsTrigger() {
    this._onReady = this._onReady.bind(this);
    let logger = new LoggerComponent(wm.config);
    let servers = new ServersComponent(
      wm.config,
      wm.routes,
      wm.sockets,
      this._onReady
    );
  }

  _onReady() {
    console.log('Server(s) are running');
  }

  _resolveInitializers() {
    if (!wm.initializers) {
      return;
    }
    this._onResolvedInitializers = this._onResolvedInitializers.bind(this);
    new InitializersComponent(wm.initializers.app, this._onResolvedInitializers);
  }

  _getDependenciesModules() {
    let dependencies = new DependencyComponent(wm.config.appPath);
    for (let x in dependencies) {
      wm[x] = dependencies[x];
    }
  }

};

module.exports = App;
