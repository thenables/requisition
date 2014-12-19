
var assert = require('assert');
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

request.defaults = function (defaults) {
  assert(typeof defaults === 'object');
  var keys = Object.keys(defaults);

  function request(url, opts) {
    opts = opts || {};
    keys.forEach(function (key) {
      if (opts[key] == null) opts[key] = defaults[key];
    });
    return new Request('GET', url, opts);
  }

  methods.forEach(function (method) {
    var METHOD = method.toUpperCase();
    request[method] = function request(url, opts) {
      opts = opts || {};
      keys.forEach(function (key) {
        if (opts[key] == null) opts[key] = defaults[key];
      });
      return new Request(METHOD, url, opts);
    }
  })

  return request;
}
