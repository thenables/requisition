
var Promise = require('native-or-bluebird');
var toArray = require('stream-to-array');
var typeis = require('type-is').is;
var statuses = require('statuses');
var typer = require('media-typer');
var memo = require('memorizer');
var zlib = require('zlib');
var cp = require('fs-cp');

var slice = [].slice;

module.exports = Response;

function Response(req, res, options) {
  this.request = req;
  this.response = res;
  this.options = options;

  this.status =
  this.statusCode = res.statusCode;
  this.header =
  this.headers = res.headers;

  // empty the stream when the response body is irrelevant
  // because node streams are dumb like that
  var status = this.status;
  if (this.length === 0
    || statuses.empty[status]
    || statuses.redirect[status]) res.resume();
}

memo(Response.prototype, 'length', function () {
  var length = this.response.headers['content-length'];
  if (length != null) return ~~length;
})

Response.prototype.is = function (types) {
  var type = this.headers['content-type'];
  if (!type) return false;
  if (!Array.isArray(types)) types = slice.call(arguments);
  return typeis(type, types);
}

/**
 * Get header
 *
 * @param {String} key
 * @return {String}
 * @api public
 */

Response.prototype.get = function (key) {
  return this.response.headers[key.toLowerCase()];
}

/**
 * Get charset
 *
 * @return {String}
 * @api public
 */

memo(Response.prototype, 'charset', function () {
  var type = this.get('Content-Type');
  if (!type) return;

  return typer.parse(type).parameters.charset;
})

/**
 * Get header `ETag`
 *
 * @return {String}
 * @api public
 */

memo(Response.prototype, 'etag', function () {
  return this.get('ETag');
})

/**
 * Get header `Last-Modified`
 *
 * @return {String}
 * @api public
 */

memo(Response.prototype, 'lastModified', function () {
  var date = this.get('Last-Modified');
  if (date) return new Date(date);
})

Response.prototype.buffer = function () {
  return toArray(this.response).then(concatBuffer);
}

function concatBuffer(arr) {
  return Buffer.concat(arr);
}

// TODO: use raw-body and inflation once it returns a promise
Response.prototype.text = function () {
  var stream = this.response;
  return new Promise(function (resolve, reject) {
    switch (stream.headers['content-encoding']) {
      case 'gzip':
        stream = stream.on('error', reject).pipe(zlib.createGunzip());
        break;
      /* istanbul ignore next */
      case 'deflate':
        stream = stream.on('error', reject).pipe(zlib.createInflate());
        break;
    }
    var str = '';
    stream.setEncoding('utf8');
    stream.on('data', function (chunk) {
      str += chunk;
    });
    stream.on('error', reject);
    stream.on('end', function () {
      resolve(str);
    });
  })
}

Response.prototype.json = function () {
  return this.text().then(JSON.parse);
}

Response.prototype.saveTo = function (filename) {
  var stream = this.response;
  var encoding = stream.headers['content-encoding'];

  switch (encoding) {
    case 'gzip':
      stream = stream.pipe(zlib.createGunzip());
      break;
    /* istanbul ignore next */
    case 'deflate':
      stream = stream.pipe(zlib.createInflate());
      break;
  }

  return cp(stream, filename);
}

Response.prototype.pipe = function (dest, opts) {
  return this.response.pipe(dest, opts);
}

Response.prototype.dump = function () {
  this.response.resume();
  return this;
}

Response.prototype.destroy = function () {
  this.response.destroy();
  return this;
}
