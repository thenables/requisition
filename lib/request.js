
var url = require('url');
var fs = require('mz/fs');
var path = require('path');
var http = require('http');
var https = require('https');
var memo = require('memorizer');
var mime = require('mime-types');
var destroy = require('destroy');
var Promise = require('native-or-bluebird');

var Response = require('./response');

module.exports = Request;

function Request(method, uri, _options) {
  var options = this.options = url.parse(uri);
  if (_options) for (var key in _options) options[key] = _options[key];
  options.method = method;
  var headers =
  options.headers =
  this.headers = options.headers || {};
  headers['accept-encoding'] = headers['accept-encoding'] || 'gzip';
  headers['user-agent'] = headers['user-agent'] || 'https://github.com/thenables/requisition';
  this._http = options.protocol === 'https:' ? https : http;
}

Request.prototype.set = function (key, value) {
  var headers = this.options.headers;
  if (typeof key === 'object') for (var x in key) headers[x] = key[x];
  else headers[key] = value;
  return this;
}

Request.prototype.type = function (type) {
  var type = mime.contentType(type);
  if (type) this.options.headers['content-type'] = type;
  return this;
}

Request.prototype.sendFile = function (filename) {
  this.options.filename = path.resolve(filename);
  this.type(path.basename(filename));
  return this;
}

Request.prototype.then = function (resolve, reject) {
  return this.promise.then(resolve, reject);
}

Request.prototype.catch = function (reject) {
  return this.promise.catch(reject);
}

Request.prototype.expectContinue = function () {
  this.options.headers.expect = '100-continue';
  this._expectContinue = true;
  return this;
}

Request.prototype._create = function () {
  return this.request = this.request || this._http.request(this.options);
}

Request.prototype.setLength = function () {
  var self = this;
  var headers = self.options.headers;
  if (headers['content-length']) return Promise.resolve();

  var filename = this.options.filename;
  if (filename) return fs.stat(filename).then(function (stats) {
    headers['content-length'] = String(stats.size);
  });

  return Promise.resolve();
}

Request.prototype._sendFile = function () {
  var self = this;
  return new Promise(function (resolve, reject) {
    var req = self._create();
    var stream = fs.createReadStream(self.options.filename);
    stream.on('error', /* istanbul ignore next */ function (err) {
      req.abort();
      reject(err);
    });
    req.on('error', /* istanbul ignore next */ function (err) {
      destroy(stream);
      reject(err);
    });
    req.on('response', function (res) {
      resolve(new Response(req, res, self.options));
    });
    req.on('close', /* istanbul ignore next */ function () {
      destroy(stream);
    })
    stream.pipe(req);
  })
}

memo(Request.prototype, 'promise', function () {
  var self = this;
  return this.setLength().then(function () {
    if (self._expectContinue) return new Promise(function (resolve, reject) {
      // TODO: timeout
      // TODO: proper event cleanup
      self._create()
      .on('error', reject)
      .on('continue', resolve);
    }).then(function () {
      if (self.options.filename) return self._sendFile();
    });

    if (self.options.filename) return self._sendFile();

    return new Promise(function (resolve, reject) {
      var req = self._create()
      .on('error', reject)
      .on('response', function (res) {
        resolve(new Response(req, res, self.options));
      });

      // TODO: handle the request body
      req.end();
    })
  })
});
