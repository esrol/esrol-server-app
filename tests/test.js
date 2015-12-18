'use strict';
let expect = require('chai').expect;
let App = require('../index.js');
let path = require('path');
let request = require('request');

require('mocha-sinon');

describe('App Success...', () => {

  describe('Should create http server and use the callback', () => {
    it('Should create an app', () => {
      new App(path.join(__dirname, './mocks/success/http-server-1/app'), () => {
        describe('On http request to "localhost:3333/test"', () => {
          it('Should return "test"', (done) => {
            request('http://localhost:3333/test', (err, response) => {
              expect(response.body).to.equal('test');
              done();
            });
          });
        });
      });
    });
  });

});

describe('App Fail...', () => {

  let should = 'Throw an error';

  describe('Creating app with wrong path', () => {
    it(should, () => {
      expect(() => { require('./mocks/wrong-app-path/app'); }).to.throw(Error);
    });
  });

});