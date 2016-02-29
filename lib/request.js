
var url = require('url');
var fs = require('mz/fs');
var path = require('path');
var http = require('http');
var https = require('https');
var cookie = require('cookie');
var qs = require('querystring');
var memo = require('memorizer');
var status = require('statuses');
var mime = require('mime-types');
var destroy = require('destroy');
var typer = require('media-typer');
var createError = require('http-errors');
var Promise = require('any-promise');

var Response = require('./response');

module.exports = Request;

function Request(method, uri, _options) {
  var options = this.options = url.parse(uri, true);
  if (_options) for (var key in _options) options[key] = _options[key];
  options.method = method;
  var headers =
  options.headers =
  this.headers = options.headers || {};
  headers['accept-encoding'] = headers['accept-encoding'] || 'gzip';
  headers['user-agent'] = headers['user-agent'] || 'https://github.com/thenables/requisition';
  this._http = options.protocol === 'https:' ? https : http;
  this.redirects(options.redirects || 3);
  this._cookie = '';
  this._redirects = 0;
  this._redirectList = [];
}

/**
 * Set header
 *
 * Examples:
 *
 *   .set('Accept', 'application/json')
 *   .set({ Accept: 'application/json' })
 *
 * @param {String|Object} key
 * @param {String} value
 * @return {Request}
 * @api public
 */
Request.prototype.set = function (key, value) {
  var headers = this.options.headers;
  // TODO: use Object.keys()
  if (typeof key === 'object') for (var x in key) headers[x] = key[x];
  else headers[key] = value;
  return this;
}

/**
 * Set Authorization
 *
 * Examples:
 *
 *   .auth('user', '1234')
 *   .auth('user:1234')
 *   .auth('user')
 *
 * @param {String} name
 * @param {String} pass
 * @return {Request}
 * @api public
 */
Request.prototype.auth = function (name, pass) {
  pass = pass || '';
  if (!~name.indexOf(':')) name += ':';
  var str = new Buffer(name + pass).toString('base64');
  this.set('Authorization', 'Basic ' + str);
  return this;
}

/**
 * Set http agent
 *
 * @param {http.Agent} agent
 * @return {Request}
 * @api public
 */
Request.prototype.agent = function (agent) {
  var options = this.options;
  if (agent instanceof http.Agent) options.agent = agent;
  else options.agent = false;
  return this;
}

/**
 * Set timeout
 *
 * @param {Number} ms
 * @return {Request}
 * @api public
 */
Request.prototype.timeout = function (ms) {
  this._timeout = ms;
  return this;
}

/**
 * Clear timeout
 *
 * @return {Request}
 * @api public
 */
Request.prototype.clearTimeout = function () {
  this._timeout = 0;
  clearTimeout(this._timer);
  return this;
}

/**
 * Set max redirects
 *
 * @param {Number} num
 * @return {Request}
 * @api public
 */
Request.prototype.redirects = function (num) {
  this._maxRedirects = num;
  return this;
}

/**
 * Set header `If-Modified-Since`
 *
 * Examples:
 *
 *   .ifModifiedSince(1418974642467)
 *   .ifModifiedSince('2015-01-01')
 *   .ifModifiedSince(new Date())
 *
 * @param {Date|string|number} date
 * @return {Request}
 * @api public
 */
Request.prototype.ifModifiedSince = function (date) {
  if (typeof date === 'number' || typeof date === 'string') date = new Date(date);
  this.set('If-Modified-Since', date.toUTCString());
  return this;
}

/**
 * Set header `If-None-Match`
 *
 * @param {String} value
 * @return {Request}
 * @api public
 */
Request.prototype.ifNoneMatch = function (value) {
  this.set('If-None-Match', value);
  return this;
}

/**
 * Set header `Content-Type`
 *
 * Examples:
 *
 *   .type('json')
 *   .type('application/json')
 *
 * @param {String} type
 * @return {Request}
 * @api public
 */
Request.prototype.type = function (type) {
  var type = mime.contentType(type);
  if (type) this.options.headers['content-type'] = type;
  return this;
}

/**
 * Set cookie
 *
 * @param {String} key
 * @param {String} value
 * @param {Object} options
 * @api public
 */

Request.prototype.cookie = function (key, value, options) {
  var args = Array.prototype.slice.call(arguments);
  var hdr = cookie.serialize.apply(null, args);
  this._cookie = this._cookie ? this._cookie + '; ' + hdr : hdr;
  this.set('Cookie', this._cookie);
  return this;
}

/**
 * Add query string
 *
 * @param {Object} object
 * @return {Request}
 * @api public
 */
Request.prototype.query = function (object) {
  var query = this.options.query;

  // TODO: use Object.keys()
  for (var i in object) {
    query[i] = object[i];
  }

  return this;
}

/**
 * Send data
 *
 * Examples:
 *
 *   .send('name=hello')
 *   .send({ name: 'hello' })
 *
 * @param {String|Object} body
 * @return {Request}
 * @api public
 */
Request.prototype.send = function (body) {
  var type = this.options.headers['content-type'];

  if (isObject(body) && isObject(this._body)) {
    // merge body
    // TODO: use Object.assign()
    for (var key in body) {
      this._body[key] = body[key];
    }
  } else if (typeof body === 'string') {
    if (!type) {
      this.options.headers['content-type'] = type = 'application/x-www-form-urlencoded';
    }

    if (typer.parse(type).subtype === 'x-www-form-urlencoded') {
      this._body = this._body ? this._body + '&' + body : body;
    } else {
      this._body = (this._body || '') + body;
    }
  } else {
    this._body = body;
  }

  // default to json
  if (!type) this.type('json');

  return this;
}

/**
 * Send file
 *
 * @param {String} filename
 * @return {Request}
 * @api public
 */
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
  this.request = this.request || this._http.request(this.options);

  if (this._timeout && !this._timer) {
    var self = this;
    this._timer = setTimeout(function () {
      self.request.abort();
      self.request.emit('error', createError(408, 'Request Time-out'));
    }, this._timeout);
  }
  return this.request;
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

Request.prototype.redirect = function (res) {
  var max = this._maxRedirects;
  if (!max || this._redirects >= max) {
    res.redirects = this._redirectList;
    return Promise.resolve(new Response(this.request, res, this.options));
  }

  this._redirects++;
  var uri = res.headers.location;
  var options = this.options;
  var method = options.method;

  // location
  if (!~uri.indexOf('://')) {
    if (uri.indexOf('//') !== 0) {
      uri = '//' + options.host + uri;
    }
    uri = options.protocol + uri;
  }

  res.resume();

  delete this.request;
  options = this.options = url.parse(uri, true);
  options.method = method === 'HEAD' ? 'HEAD' : 'GET';
  this._http = options.protocol === 'https:' ? https : http;
  this.headers = options.headers = cleanHeader(this.headers) || {};

  // redirect
  this._body = null;
  this._redirectList.push(uri);
  var self = this;

  return new Promise(function (resolve, reject) {
    var req = self._create();

    req.on('error', /* istanbul ignore next */ function (err) {
      reject(err);
    });
    req.on('response', function (res) {
      res.redirects = self._redirectList;
      if (status.redirect[res.statusCode]) return resolve(self.redirect(res));

      resolve(new Response(req, res, self.options));
    });

    req.end();
  })
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
      self.clearTimeout();
      if (status.redirect[res.statusCode]) return resolve(self.redirect(res));

      resolve(new Response(req, res, self.options));
    });
    req.on('close', /* istanbul ignore next */ function () {
      destroy(stream);
    })
    stream.pipe(req);
  })
}

Request.prototype._send = function () {
  var self = this;
  var body = this._body;
  var options = this.options;

  return new Promise(function (resolve, reject) {
    // body
    var type = options.headers['content-type'];

    if (isObject(body)) {
      if (typer.parse(type).subtype === 'x-www-form-urlencoded') {
        body = qs.stringify(body);
      } else {
        body = JSON.stringify(body);
      }
    }

    if (!options.headers['content-length'])
      options.headers['content-length'] = Buffer.byteLength(body);

    var req = self._create();

    req.on('error', /* istanbul ignore next */ function (err) {
      reject(err);
    });
    req.on('response', function (res) {
      self.clearTimeout();
      if (status.redirect[res.statusCode]) return resolve(self.redirect(res));

      resolve(new Response(req, res, self.options));
    });

    req.end(body);
  })
}

memo(Request.prototype, 'promise', function () {
  var self = this;
  var options = this.options;

  return this.setLength().then(function () {
    // querystring
    var querystring = qs.stringify(options.query);
    if (querystring) options.path = options.pathname + '?' + querystring;

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

    if (self._body) return self._send();

    return new Promise(function (resolve, reject) {
      var req = self._create()
      .on('error', reject)
      .on('response', function (res) {
        self.clearTimeout();
        if (status.redirect[res.statusCode]) return resolve(self.redirect(res));

        resolve(new Response(req, res, self.options));
      });

      // TODO: handle the request body
      req.end();
    })
  })
});

// TODO: use lodash
function isObject(obj) {
  return obj != null && typeof obj === 'object';
}

function cleanHeader(header) {
  delete header['content-type'];
  delete header['content-length'];
  delete header['transfer-encoding'];
  delete header['cookie'];
  delete header['host'];
  return header;
}
