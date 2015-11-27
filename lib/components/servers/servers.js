'use strict';
let cores = require('os').cpus().length;
let Servers = require('esrol-servers');
let Router = require('esrol-router');
let Middelwares = require('esrol-middlewares');
let servers = new WeakMap();

module.exports = class ServersComponent {

  constructor(config, routes, sockets, middlewares, callback) {
    this._waitingForServers = 0;
    this._callback = callback;
    this._createServers(config, routes, sockets);
  }

  _createServers(config, routes, sockets) {
    let conf = config.servers;
    this._onServerListening = this._onServerListening.bind(this);
    if (config.cluster.enabled) {
      if (config.cluster.cores === 'auto') {
        config.cluster.cores = cores;
      }
    }
    if (conf.http.enabled) {
      this._createHttpServer(conf.http, config.cluster, routes.httpRoutes);
    }
    if (conf.https.enabled) {
      this._createHttpsServer(conf.https, config.cluster, routes.httpsRoutes);
    }
    if (conf.tcp.enabled) {
      this._createTcpServer(conf.tcp, config.cluster, sockets);
    }
    if (conf.udp.enabled) {
      this._createUdpServer(conf.udp, config.cluster, sockets);
    }
    if (config.cluster.enabled) {
      Servers.cluster(config.cluster.cores);
    }
  }

  _createHttpServer(config, cluster, routes) {
    if (!routes || !Object.keys(routes.app).length) {
      let e = 'Please see the documentation in order to consume http server';
      throw new Error(e);
    }
    let router = new Router();
    let middlewares = new Middelwares();
    // this._setMiddlewares(middlewares, )
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

  _onServerCreated() {
    this._waitingForServers++;
  }

  _setRouterRoutes(router, routes) {
    for (let route in routes) {
      try {
        router.registerRoute(routes[route]);
      } catch(e) {
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
    if (!routes || !Object.keys(routes.app).length) {
      let e = 'Please see the documentation in order to consume https server';
      throw new Error(e);
    }
    this._onServerCreated();
  }

  _createUdpServer(config, cluster, sockets) {
    if (!sockets.app.udp || typeof sockets.app.udp.onRequest !== 'function') {
      let e = 'Please see the documentation in order to consume udp server';
      throw new Error(e);
    }
    let udpSettings = {
      port: 3335,
      type: config.type,
      cluster: cluster.enabled,
      router: sockets.app.udp.onRequest,
      onListening: this._onServerListening
    };
    Servers.createUdpServer(udpSettings);
    this._onServerCreated();
  }

  _createTcpServer(config, cluster, sockets) {
    if (!sockets.app.tcp || typeof sockets.app.tcp.onRequest !== 'function') {
      let e = 'Please see the documentation in order to consume tcp server';
      throw new Error(e);
    }
    let tcpSettings = {
      port: 3334,
      cluster: cluster.enabled,
      router: sockets.app.tcp.onRequest,
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
