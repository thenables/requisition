
var url = require('url');
var http = require('http');
var https = require('https');
var memo = require('memorizer');
var Promise = require('native-or-bluebird');

var Response = require('./response');

module.exports = Request;

function Request(method, uri, _options) {
  var options = this.options = url.parse(uri);
  if (_options) for (var key in _options) options[key] = _options[key];
  options.method = method;
  options.headers = this.headers = options.headers || {};
  this._http = options.protocol === 'https:' ? https : http;
}

Request.prototype.set = function (key, value) {
  var headers = this.options.headers || {};
  if (typeof key === 'object') for (var x in key) headers[x] = key[x];
  else headers[key] = value;
  return this;
}

Request.prototype.then = function (resolve, reject) {
  return this.promise.then(resolve, reject);
}

Request.prototype.catch = function (reject) {
  return this.promise.catch(reject);
}

memo(Request.prototype, 'promise', function () {
  var self = this;
  return new Promise(function (resolve, reject) {
    var req = self.request = self._http.request(self.options)
    .on('error', reject)
    .on('response', function (res) {
      resolve(new Response(req, res, self.options));
    });

    req.end();
  });
});
