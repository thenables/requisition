
var Promise = require('native-or-bluebird');
var toArray = require('stream-to-array');
var typeis = require('type-is').is;
var statuses = require('statuses');
var zlib = require('zlib');
var cp = require('fs-cp');

var slice = [].slice;

module.exports = Response;

function Response(req, res, options) {
  this.req = req;
  this.res = res;
  this.options = options;

  // empty the stream when the response body is irrelevant
  // because node streams are dumb like that
  var length = this.length;
  var status = this.status;
  if (length != null
    || statuses.empty[status]
    || statuses.redirect[status]) res.resume();
}

Object.defineProperties(Response.prototype, {
  status: {
    get: function () {
      return this.res.statusCode;
    }
  },
  headers: {
    get: function () {
      return this.res.headers;
    }
  },
  // etag: {},
  // lastModified: {},
  // type: {},
  // charset: {},
})

Response.prototype.is = function (types) {
  var type = this.headers['content-type'];
  if (!type) return false;
  if (!Array.isArray(types)) types = slice.call(arguments);
  return typeis(type, types);
}

Object.defineProperty(Response.prototype, 'length', {
  get: function () {
    var length = this.res.headers['content-length'];
    if (length != null) return ~~length;
  }
})

Response.prototype.get = function (key) {
  return this.res.headers[key.toLowerCase()];
}

Response.prototype.buffer = function () {
  return toArray(this.res).then(concatBuffer);
}

function concatBuffer(arr) {
  return Buffer.concat(arr);
}

// TODO: use raw-body and inflation once it returns a promise
Response.prototype.text = function () {
  var stream = this.res;
  return new Promise(function (resolve, reject) {
    switch (stream.headers['content-encoding']) {
      case 'gzip':
        stream = stream.on('error', reject).pipe(zlib.createGunzip());
        break;
      case 'deflate':
        stream = stream.on('error', reject).pipe(zlib.createDeflate());
        break;
    }
    stream.setEncoding('utf8');
    var str = '';
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

// TODO: decompress the file
Response.prototype.saveTo = function (filename) {
  return cp(this.res, filename);
}

Response.prototype.dump = function () {
  this.res.resume();
  return this;
}

Response.prototype.destroy = function () {
  this.res.destroy();
  return this;
}
