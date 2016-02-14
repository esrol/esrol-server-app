/**
 * @author Ivaylo Ivanov
 * @private
 * @class Dependency
 * @description Combines esrol-servers, esrol-middlewares and esrol-router
 * in application aka Express.js
 * @requires os
 * @requires esrol-servers
 * @requires esrol-router
 * @requires esrol-middlewares
 * @requires debug
 */
'use strict';
const Servers = require('esrol-servers');
const Router = require('esrol-router');
const Middelwares = require('esrol-middlewares');
const debug = require('debug')('esrol-server-app:components:servers');
let cores = require('os').cpus().length;

module.exports = class ServersComponent {

  /**
   * @private
   * @method constructor
   * @description Call
   * 1) _resetServersCounter
   * 2) _setCallback
   * 3) _createServers
   * @param {object} config - from config.json
   * @param {object} routes - {app: {path: route}, namespaces: [path]}
   * @param {object} sockets - {app: {path: socket}, namespaces: [path]}
   * @param {object} middlewares -{app: {path: middleware}, namespaces: [path]}
   * @param {function} callback - called on server(s) listening
   * @throws {error} error // if thrown by some of the modules
   */
  constructor(config, routes, sockets, middlewares, callback) {
    this._resetServersCounter();
    this._setCallback(callback);
    this._createServers(config, routes, sockets, middlewares);
  }

  /**
   * @private
   * @method _resetServersCounter
   * @description Set _waitingForServers to 0
   */
  _resetServersCounter() {
    this._waitingForServers = 0;
  }

  /**
   * @private
   * @method _setCallback
   * @description Set _callback, called on server(s) listening
   * @param {function} callback - called on server(s) listening
   */
  _setCallback(callback) {
    this._callback = callback;
  }

  /**
   * @private
   * @method _createServers
   * @description Call appropriate method for each server type if enabled and
   * enable cluster if needed
   * @param {object} config - from config.json
   * @param {object} routes - {httpRoutes: {object},httpsRoutes: {object}}.....
   * @param {object} sockets - {app: {object}}....
   * @param {object} middlewares - {http-middlewares: {object}, udp-..}....
   * @throws {error} error // if thrown by some of the modules
   */
  _createServers(config, routes, sockets, middlewares) {
    let conf = config.servers;
    this._onServerListening = this._onServerListening.bind(this);
    if (config.cluster.enabled) {
      if (config.cluster.cores === 'auto') {
        config.cluster.cores = cores;
      }
    }
    if (conf.http.enabled) {
      this._createHTTPServer(
        conf.http,
        config.cluster,
        routes.httpRoutes,
        middlewares.app
      );
    }
    if (conf.http.webSockets) {
      this._enableHTTPWebSocket(sockets.app['http-websocket']);
    }
    if (conf.tcp.enabled) {
      this._createTCPServer(conf.tcp, config.cluster, sockets.app.tcp);
    }
    if (conf.udp.enabled) {
      this._createUDPServer(conf.udp, config.cluster, sockets.app.udp);
    }
    if (config.cluster.enabled) {
      Servers.cluster(config.cluster.cores);
    }
  }

  /**
   * @private
   * @method _enableHTTPWebSocket
   * @description Create http websocket
   * @param {object} socket - {index: {onRequest: function(socket) {}}}
   * @throws {error} error - if wrong argument passed
   */
  _enableHTTPWebSocket(socket) {
    debug('enable http websocket');
    if (!socket ||
      !socket.index ||
      typeof socket.index.onRequest !== 'function'
    ) {
      let e = `In order to use http websocket you need to export class
      with static "onRequest" method from /sockets/http-websocket/index.js`;
      throw new Error(e);
    }
    let sockets = Servers.createHTTPWebSocket(Servers.getHTTPServerInstance());
    sockets.on('connection', socket.index.onRequest);
  }

  /**
   * @private
   * @method _createHTTPServer
   * @description Create http server
   * @param {object} http config - from config.json
   * @param {object} cluster config - {enabled: true / false, cores: INT}
   * @param {object} routes - {app: {path: route}}.....
   * @param {object} middlewares - {http-middlewares: {object}, udp-..}....
   * @throws {error} error // if thrown by some of the modules
   * or wrong args passed
   */
  _createHTTPServer(config, cluster, routes, middlewares) {
    debug('creating http server');
    if (!routes || !Object.keys(routes.app).length) {
      let e = `You don't have any http routes, but http server is enabled.
      Please see the documentation in order to use http server ->
      https://github.com/esrol/todo-this
      `;
      throw new Error(e);
    }
    let router = new Router();
    let middleware = new Middelwares();
    this._registerMiddlewares(middleware, middlewares['http-middlewares']);
    this._setHTTPRouterMiddleware(router, middleware);
    this._setRouterMethods(router, config.methods);
    this._setHTTPNamespace(router, config.namespace);
    this._setRouterRoutes(router, routes.app);
    let settings = {
      router: router.onRequest,
      onListening: this._onServerListening,
      port: config.port,
      webSocket: config.webSockets,
      cluster: cluster.enabled
    };
    Servers.createHTTPServer(settings);
    this._onServerCreated();
  }

  /**
   * @private
   * @method _setHTTPNamespace
   * @description Set server namespace.
   * @param {object} router - instance of esrol-router class
   * @param {string} namespace - eg 'v1' which will evaluate www.example.com/v1
   */
  _setHTTPNamespace(router, namespace) {
    router.setNamespace(namespace);
  }

  /**
   * @private
   * @method _setHTTPRouterMiddleware
   * @description Set a middleware function to the router. This middleware
   * take the request and iterate through all middlewares if there is such
   * @param {object} router - instance of esrol-router class
   * @param {object} middleware - instance of esrol-middlewares class
   * @see {@link https://github.com/esrol/esrol-router/blob/master/example/dummy.js}
   * @see {@link https://github.com/esrol/esrol-middlewares/blob/master/example/dummy.js}
   */
  _setHTTPRouterMiddleware(router, middleware) {
    router.setMiddleware((req, res, route, scope) => {
      middleware.onRequest(req, res, route, scope);
    });
  }

  /**
   * @private
   * @method _registerMiddlewares
   * @description Register all middlewares
   * @param {object} middleware - instance of esrol-middlewares class
   * @param {object} middlewares - {path: middleware}...
   * @throws {error} error // if wrong structured middleware was exported
   */
  _registerMiddlewares(middleware, middlewares) {
    for (let x in middlewares) {
      try {
        middleware.registerMiddleware({
          priority: middlewares[x].priority,
          middleware: middlewares[x].onRequest
        });
      } catch (e) {
        let error = {
          error: 'Middleware must be a class with a static "priority" property' +
          ' and static method "onRequest"',
          originalError: e,
          stack: e.stack
        };
        throw new Error(JSON.stringify(error, null, 2));
      }
    }
  }

  /**
   * @private
   * @method _onServerCreated
   * @description Called when server is created. Increment _waitingForServers
   */
  _onServerCreated() {
    this._waitingForServers++;
  }

  /**
   * @private
   * @method _setRouterRoutes
   * @description Iterate through the routes and register each
   * @param {object} router - instance of esrol-router class
   * @param {object} routes - {path: route}..
   * @throws {error} error // if wrong structured route was exported
   */
  _setRouterRoutes(router, routes) {
    for (let route in routes) {
      try {
        router.registerRoute(routes[route]);
      } catch (e) {
        let error = {
          error: 'Route must be a class with a static "url" property' +
          ' and must have at least one http method',
          originalError: e,
          stack: e.stack
        };
        throw new Error(JSON.stringify(error, null, 2));
      }
    }
  }

  /**
   * @private
   * @method _setRouterMethods
   * @description Set http enabled methods for http server: GET, POST etc..
   * @param {object} router - instance of esrol-router class
   * @param {object} routes - {path: route}..
   * @throws {error} error // if thrown by router
   */
  _setRouterMethods(router, methods) {
    router.setSupportedHttpMethods(methods);
  }

  /**
   * @private
   * @method _createUDPServer
   * @description Create udp server
   * @param {object} udp config - from config.json
   * @param {object} cluster config - {enabled: true / false, cores: INT}
   * @param {object} socket - {index: {onRequest: function(msg, info) {}}}
   * @throws {error} error // if wrong args passed
   */
  _createUDPServer(config, cluster, socket) {
    debug('creating udp server');
    if (!socket ||
      !socket.index ||
      typeof socket.index.onRequest !== 'function'
    ) {
      let e = `In order to use udp server, you need to export class with static
      "onRequest" method, placed in /app/sockets/udp/index.js`;
      throw new Error(e);
    }
    let udpSettings = {
      port: config.port,
      type: config.type,
      cluster: cluster.enabled,
      router: socket.index.onRequest,
      onListening: this._onServerListening
    };
    Servers.createUDPServer(udpSettings);
    this._onServerCreated();
  }

  /**
   * @private
   * @method _createTCPServer
   * @description Create tcp server
   * @param {object} tcp config - from config.json
   * @param {object} cluster - {enabled: true / false, cores: INT}
   * @param {object} socket - {index: {onRequest: function(msg, info) {}}}
   * @throws {error} error // if wrong args passed
   */
  _createTCPServer(config, cluster, socket) {
    debug('creating tcp server');
    if (!socket ||
      !socket.index ||
      typeof socket.index.onRequest !== 'function'
    ) {
      let e = `In order to use tcp server, you need to export class with static
      "onRequest" method, placed in /app/sockets/tcp/index.js`;
      throw new Error(e);
    }
    let tcpSettings = {
      port: config.port,
      cluster: cluster.enabled,
      router: socket.index.onRequest,
      onListening: this._onServerListening
    };
    let tcpOptions = {
      allowHalfOpen: config.allowHalfOpen,
      pauseOnConnect: config.pauseOnConnect
    };
    Servers.createTCPServer(tcpSettings, tcpOptions);
    this._onServerCreated();
  }

  /**
   * @private
   * @method _onServerListening
   * @description Called when server is listening. If all enabled servers are
   * listening and if a callback was setted, call it
   */
  _onServerListening() {
    this._waitingForServers--;
    /* istanbul ignore else */
    if (this._waitingForServers === 0) {
      /* istanbul ignore else */
      if (this._callback) {
        this._callback();
      }
    }
  }

};
