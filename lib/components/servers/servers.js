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
      this._createHttpServer(
        conf.http,
        config.cluster,
        routes.httpRoutes,
        middlewares.app
      );
    }
    if (conf.http.webSockets) {
      this._enableHttpWebSocket(sockets.app.httpWebSocket);
    }
    if (conf.https.enabled) {
      this._createHttpsServer(conf.https, config.cluster, routes.httpsRoutes);
    }
    if (conf.tcp.enabled) {
      this._createTcpServer(conf.tcp, config.cluster, sockets.app.tcp);
    }
    if (conf.udp.enabled) {
      this._createUdpServer(conf.udp, config.cluster, sockets.app.udp);
    }
    if (config.cluster.enabled) {
      Servers.cluster(config.cluster.cores);
    }
  }

  _enableHttpWebSocket(socket) {
    debug('enable httpWebSockets');
    if (!socket ||
      !socket.index ||
      typeof socket.index.onRequest !== 'function'
    ) {
      let e = 'Please see the documentation in order to consume http webSocket';
      throw new Error(e);
    }
    let sockets = Servers.createHttpWebSocket(Servers.getHttpServerInstance());
    sockets.on('connection', socket.index.onRequest);
  }

  _createHttpServer(config, cluster, routes, middlewares) {
    debug('creating http server');
    if (!routes || !Object.keys(routes.app).length) {
      let e = 'Please see the documentation in order to consume http server';
      throw new Error(e);
    }
    let router = new Router();
    let middleware = new Middelwares();
    this._registerMiddlewares(middleware, middlewares.httpMiddlewares);
    this._setHttpRouterMiddleware(router, middleware);
    this._setRouterMethods(router, config.methods);
    this._setRouterRoutes(router, routes.app);
    let settings = {
      router: router.onRequest,
      onListening: this._onServerListening,
      port: config.port,
      webSocket: config.webSockets,
      cluster: cluster.enabled
    };
    Servers.createHttpServer(settings);
    this._onServerCreated();
  }

  _setHttpRouterMiddleware(router, middleware) {
    router.setMiddleware((req, res, route, scope) => {
      middleware.onRequest(req, res, route, scope);
    });
  }

  _registerMiddlewares(Middleware, middlewares) {
    for (let x in middlewares) {
      Middleware.registerMiddleware({
        priority: middlewares[x].priority,
        middleware: middlewares[x].onRequest
      });
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
        console.log(e);
        console.log(e.stack);
        process.exit();
      }
    }
  }

  _setRouterMethods(router, methods) {
    router.setSupportedHttpMethods(methods);
  }

  _createHttpsServer(config, cluster, routes) {
    debug('creating https server');
    if (!routes || !Object.keys(routes.app).length) {
      let e = 'Please see the documentation in order to consume https server';
      throw new Error(e);
    }
    this._onServerCreated();
  }

  _createUdpServer(config, cluster, socket) {
    debug('creating udp server');
    if (!socket ||
      !socket.index ||
      typeof socket.index.onRequest !== 'function'
    ) {
      let e = 'Please see the documentation in order to consume udp server';
      throw new Error(e);
    }
    let udpSettings = {
      port: 3335,
      type: config.type,
      cluster: cluster.enabled,
      router: socket.index.onRequest,
      onListening: this._onServerListening
    };
    Servers.createUdpServer(udpSettings);
    this._onServerCreated();
  }

  _createTcpServer(config, cluster, socket) {
    debug('creating tcp server');
    if (!socket ||
      !socket.index ||
      typeof socket.index.onRequest !== 'function'
    ) {
      let e = 'Please see the documentation in order to consume tcp server';
      throw new Error(e);
    }
    let tcpSettings = {
      port: 3334,
      cluster: cluster.enabled,
      router: socket.index.onRequest,
      onListening: this._onServerListening
    };
    let tcpOptions = {
      allowHalfOpen: config.allowHalfOpen,
      pauseOnConnect: config.pauseOnConnect
    };
    Servers.createTcpServer(tcpSettings, tcpOptions);
    this._onServerCreated();
  }

  _onServerListening() {
    this._waitingForServers--;
    if (this._waitingForServers === 0) {
      if (this._callback) {
        this._callback();
      }
    }
  }

};
