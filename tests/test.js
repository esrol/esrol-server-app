'use strict';
let expect = require('chai').expect;
let App = require('../index.js');
let path = require('path');
let cluster = require('cluster');
let request = require('request');
let net = require('net');
let ioc = require('socket.io-client');
require('mocha-sinon');

describe('App Success...', () => {

  describe('Cluster', () => {
    describe('Create app using http, tcp and udp servers', () => {
      let should = ``;
      it(should, (done) => {
        let finished = false;
        cluster.on('message', () => {
          if (!finished) {
            done();
            finished = true;
          }
        });
        let appPath = './mocks/success/http-tcp-udp-servers/app';
        new App(path.join(__dirname, appPath), () => {
          let client = net.connect({port: 4334});
          client.on('data', function(data) {
            expect(data.toString()).to.equal('success');
          });
          setTimeout(() => {
            request('http://localhost:3337/test', (err, response) => {
              expect(response.body).to.equal('test');
              process.send('done');
              done();
            });
          }, 100);
        });
      });
    });
    describe('App with "auto" value for cpu cores', () => {
      let should = ``;
      it(should, (done) => {
        let finished = false;
        cluster.on('message', () => {
          if (!finished) {
            done();
            finished = true;
          }
        });
        let appPath = './mocks/success/http-tcp-udp-servers-auto-cores/app';
        new App(path.join(__dirname, appPath), () => {
          let client = net.connect({port: 4335});
          client.on('data', function(data) {
            expect(data.toString()).to.equal('success');
          });
          setTimeout(() => {
            request('http://localhost:3338/test', (err, response) => {
              expect(response.body).to.equal('test');
              process.send('done');
              done();
            });
          }, 100);
        });
      });
    });
  });

  if (cluster.isMaster) {
    describe('Non cluster', () => {

      let des = 'Create an app with http server, use the cb and make a request';
      describe(des, () => {
        it('On app created, make request and receive "test" message',
        (done) => {
          new App(path.join(__dirname, './mocks/success/http-server-1/app'),
          () => {
            request('http://localhost:3332/test', (err, response) => {
              expect(response.body).to.equal('test');
              done();
            });
          });
        });
      });

      describe('Create an app and make a request', () => {
        it('On app created, make request and receive "test" message',
        (done) => {
          new App(path.join(__dirname, './mocks/success/http-server-2/app'));
          request('http://localhost:3334/test', (err, response) => {
            expect(response.body).to.equal('test');
            done();
          });
        });
      });

      describe('Create an app, use initializer and make a request',
      () => {
        let should = `Initializer should set static value in test route
        and receive it on request`;
        it(should, (done) => {
          new App(path.join(__dirname, './mocks/success/initializers/app'),
          () => {
            request('http://localhost:3335/test', (err, response) => {
              expect(response.body).to.equal('initializer');
              done();
            });
          });
        });
      });

      describe('Create an app, use http middleware and make a request', () => {
        let should = `Middleware should set property with value on each request
        and receive it as response from route`;
        it(should, (done) => {
          new App(path.join(__dirname, './mocks/success/http-middlewares/app'),
          () => {
            request('http://localhost:3336/test', (err, response) => {
              expect(response.body).to.equal('middleware');
              done();
            });
          });
        });
      });

      describe('Create app without initializer, then make request', () => {
        let should = `The response body should be "success"`;
        it(should, (done) => {
          let appPath = './mocks/success/http-server-without-initializers-folder/app';
          new App(path.join(__dirname, appPath), () => {
            request('http://localhost:3339/test', (err, response) => {
              expect(response.body).to.equal('success');
              done();
            });
          });
        });
      });

      describe('Create app without middl. folder, then make request', () => {
        let should = `The response body should be "success"`;
        it(should, (done) => {
          let appPath = './mocks/success/http-server-without-middlewares-folder/app';
          new App(path.join(__dirname, appPath), () => {
            request('http://localhost:3341/test', (err, response) => {
              expect(response.body).to.equal('success');
              done();
            });
          });
        });
      });

      describe('Create app with http server and websockets', () => {
        let should = `The http response should be "test" and the socket
        should emit "message" with "success" value`;
        it(should, (done) => {
          let appPath = './mocks/success/http-server-with-websockets/app';
          new App(path.join(__dirname, appPath), () => {
            let c = ioc('http://localhost:3342', {});
            c.on('message', (message) => {
              expect(message).to.equal('success');
              done();
            });
            request('http://localhost:3342/test', (err, response) => {
              expect(response.body).to.equal('test');
            });
          });
        });
      });
    });
  }

});

describe('App Fail...', () => {

  let should = 'Should throw an error';

  describe('Creating app without a path', () => {
    it(should, () => {
      expect(() => {
        try {
          new App();
        } catch (e) {
          // console.log (e)
          throw e;
        }
      }).to.throw(Error);
    });
  });

  describe('Creating app with http server without http route', () => {
    it(should, () => {
      expect(() => {
        try {
          require('./mocks/fail/http-server-without-route/app');
        } catch (e) {
          // console.log (e)
          throw e;
        }
      }).to.throw(Error);
    });
  });

  describe('Creating app http server with broken http middleware', () => {
    it(should, () => {
      expect(() => {
        try {
          require('./mocks/fail/http-middlewares/app');
        } catch (e) {
          // console.log (e)
          throw e;
        }
      }).to.throw(Error);
    });
  });

  describe('Creating app with broken initializer class', () => {
    it(should, () => {
      expect(() => {
        try {
          require('./mocks/fail/initializer/app');
        } catch (e) {
          // console.log (e)
          throw e;
        }
      }).to.throw(Error);
    });
  });

  describe('Creating http server with broken http route', () => {
    it(should, () => {
      expect(() => {
        try {
          require('./mocks/fail/http-server-with-broken-route/app');
        } catch (e) {
          // console.log (e)
          throw e;
        }
      }).to.throw(Error);
    });
  });

  describe('Creating tcp server without tcp folder and index class', () => {
    it(should, () => {
      expect(() => {
        try {
          require('./mocks/fail/missing-tcp-index-socket/app');
        } catch (e) {
          // console.log (e)
          throw e;
        }
      }).to.throw(Error);
    });
  });

  describe('Creating udp server without udp folder with index class', () => {
    it(should, () => {
      expect(() => {
        try {
          require('./mocks/fail/missing-udp-index-socket/app');
        } catch (e) {
          // console.log (e)
          throw e;
        }
      }).to.throw(Error);
    });
  });

  describe('Creating app http server without http routes folder', () => {
    it(should, () => {
      expect(() => {
        try {
          require('./mocks/fail/http-server-without-http-routes-folder/app');
        } catch (e) {
          // console.log (e)
          throw e;
        }
      }).to.throw(Error);
    });
  });

  describe('Creating http server with websocket without index.js', () => {
    it(should, () => {
      expect(() => {
        try {
          require('./mocks/fail/http-server-with-websockets-without-websocket-folder/app');
        } catch (e) {
          // console.log (e)
          throw e;
        }
      }).to.throw(Error);
    });
  });

  describe('Creating app with wrong path', () => {
    it(should, () => {
      expect(() => {
        require('./mocks/fail/corrupted-config/app');
      }).to.throw(Error);
    });
  });

  describe('Creating app with corrupted config file', () => {
    it(should, () => {
      expect(() => {
        require('./mocks/fail/wrong-app-path/app');
      }).to.throw(Error);
    });
  });

});
