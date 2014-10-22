
var methods = require('methods');
var Request = require('./request');

module.exports = request;

function request(url) {
  return new Request('GET', url);
}

methods.forEach(function (method) {
  var METHOD = method.toUpperCase();
  request[method] = function request(url) {
    return new Request(METHOD, url);
  }
})
