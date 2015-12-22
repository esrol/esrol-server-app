'use strict';
let cores = require('os').cpus().length;
let Servers = require('esrol-servers');
let Router = require('esrol-router');
let Middelwares = require('esrol-middlewares');
let debug = require('debug')('esrol-server-app:components:servers');

module.exports = class ServersComponent {

  constructor(config, routes, sockets, middlewares, callback) {
    this._waitingForServers = 0;
    this._callback = callback;
    this._createServers(config, routes, sockets, middlewares);
  }

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

  _enableHTTPWebSocket(socket) {
    debug('enable httpWebSockets');
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

  _setHTTPRouterMiddleware(router, middleware) {
    router.setMiddleware((req, res, route, scope) => {
      middleware.onRequest(req, res, route, scope);
    });
  }

  _registerMiddlewares(Middleware, middlewares) {
    for (let x in middlewares) {
      try {
        Middleware.registerMiddleware({
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

  _onServerCreated() {
    this._waitingForServers++;
  }

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

  _setRouterMethods(router, methods) {
    router.setSupportedHttpMethods(methods);
  }

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
