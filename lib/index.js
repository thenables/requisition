
var methods = require('methods');
var Request = require('./request');

module.exports = request;

function request(url, opts) {
  return new Request('GET', url, opts);
}

methods.forEach(function (method) {
  var METHOD = method.toUpperCase();
  request[method] = function request(url, opts) {
    return new Request(METHOD, url, opts);
  }
})
