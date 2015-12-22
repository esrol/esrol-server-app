'use strict';
module.exports = class Index {

  static onRequest(socket) {
    socket.emit('message', 'success');
  }

};
