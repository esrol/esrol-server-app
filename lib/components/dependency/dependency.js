'use strict';
let fs = require('fs');
let path = require('path');
let Autoloader = require('esrol-autoloader');
let debug = require('debug')('esrol-server-app:components:dependency');

module.exports = class Dependency {

  constructor(appPath) {
    return {
      routes: {
        httpRoutes: this._includeHttpRoutes(appPath),
        httpsRoutes: this._includeHttpsRoutes(appPath)
      },
      middlewares: this._includeMiddlewares(appPath),
      initializers: this._includeInitializers(appPath),
      sockets: this._includeSockets(appPath)
    };
  }

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

  _includeMiddlewares(appPath) {
    debug('including middlewares');
    let settings = {
      getNamespaces: false,
      getAsObject: true,
      path: path.join(appPath, 'middlewares')
    };
    if (!fs.existsSync(settings.path)) {
      return;
    }
    return new Autoloader(settings);
  }

};
