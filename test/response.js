
var Promise = require('any-promise');
var cookieParser = require('cookie-parser');
var tmpdir = require('os').tmpdir();
var cat = require('concat-stream');
var express = require('express');
var join = require('path').join;
var assert = require('assert');
var fs = require('fs');

var request = require('..');

describe('Response', function () {
  describe('.is', function () {
    var res;

    before(function () {
      return request('https://github.com').then(function (_res) {
        res = _res
      })
    })

    it('.is(json)', function () {
      assert.equal(res.is('json'), false)
    })

    it('.is(html)', function () {
      assert.equal(res.is('html'), 'html')
    })
  })

  describe('.etag()', function () {
    it('should return etag', function () {
      var app = express();
      app.use(function (req, res) {
        res.set('ETag', '"test-etag"');
        res.end('test');
      })
      return new Promise(function (resolve, reject) {
        app.listen(function (err) {
          if (err) throw err;
          resolve(this.address().port);
        })
      }).then(function (port) {
        return request('http://127.0.0.1:' + port).then(function (response) {
          assert.equal(response.etag, '"test-etag"');
        })
      })
    })
  })

  describe('.charset()', function () {
    it('should return charset', function () {
      var app = express();
      app.use(function (req, res) {
        res.send('test');
      })
      return new Promise(function (resolve, reject) {
        app.listen(function (err) {
          if (err) throw err;
          resolve(this.address().port);
        })
      }).then(function (port) {
        return request('http://127.0.0.1:' + port).then(function (response) {
          assert.equal(response.charset, 'utf-8');
        })
      })
    })
  })

  describe('.lastModified()', function () {
    it('should return lastModified', function () {
      var app = express();
      var lastModified = new Date(1417681633000);
      app.use(function (req, res) {
        res.set('Last-Modified', lastModified.toUTCString());
        res.end('test');
      })
      return new Promise(function (resolve, reject) {
        app.listen(function (err) {
          if (err) throw err;
          resolve(this.address().port);
        })
      }).then(function (port) {
        return request('http://127.0.0.1:' + port).then(function (response) {
          assert.equal(response.lastModified.getTime(), lastModified.getTime());
        })
      })
    })
  })

  describe('.cookies()', function () {
    it('should get cookies', function () {
      var app = express();
      app.use(cookieParser());
      app.use(function (req, res) {
        res.cookie('name', 'test');
        res.cookie('word', 'hello');
        res.end();
      })
      return new Promise(function (resolve, reject) {
        app.listen(function (err) {
          if (err) throw err;
          resolve(this.address().port);
        })
      }).then(function (port) {
        return request('http://127.0.0.1:' + port).then(function (response) {
          assert.equal(response.cookies.name, 'test');
          assert.equal(response.cookies.word, 'hello');
        })
      })
    })
  })

  describe('.buffer()', function () {
    it('should return a Buffer', function () {
      return request('https://github.com').then(function (response) {
        return response.buffer()
      }).then(function (buffer) {
        assert(Buffer.isBuffer(buffer))
      })
    })
  })

  describe('.text()', function () {
    it('should return a string', function () {
      return request('https://registry.npmjs.org/').then(function (response) {
        assert(response.status === 200);
        return response.text()
      }).then(function (string) {
        var data = JSON.parse(string)
        assert(typeof data === 'object')
        assert(typeof data.db_name === 'string')
      })
    })
  })

  describe('.json()', function () {
    it('should return an object', function () {
      return request('https://registry.npmjs.org/').then(function (response) {
        assert(response.status === 200);
        return response.json()
      }).then(function (data) {
        assert(typeof data === 'object')
        assert(typeof data.db_name === 'string')
      })
    })
  })

  describe('.dump()', function () {
    return request('http://ip.jsontest.com/').then(function (response) {
      return response.dump()
    })
  })

  describe('.destroy()', function () {
    return request('http://ip.jsontest.com/').then(function (response) {
      return response.destroy()
    })
  })

  describe('.saveTo()', function () {
    it('should save to file', function () {
      var filename = join(tmpdir, Math.random().toString(36).slice(2));
      return request('http://ip.jsontest.com/').then(function (response) {
        return response.saveTo(filename);
      }).then(function () {
        return fs.statSync(filename);
      })
    })

    it('should decompress and save to file', function () {
      var filename = join(tmpdir, Math.random().toString(36).slice(2));
      return request('https://github.com').then(function (response) {
        return response.saveTo(filename);
      }).then(function () {
        assert.equal(fs.readFileSync(filename, 'utf8').trim().indexOf('<!DOCTYPE html>'), 0);
      })
    })

    it('should save to a random file if no filename is passed', function () {
      return request('https://github.com').then(function (response) {
        return response.saveTo();
      }).then(function (filename) {
        assert.equal(fs.readFileSync(filename, 'utf8').trim().indexOf('<!DOCTYPE html>'), 0);
      })
    })
  })

  describe('.pipe()', function () {
    it('should pipe', function () {
      return request('https://github.com').then(function (response) {
        return new Promise(function (resolve) {
          response.pipe(cat(resolve));
        });
      }).then(function (buf) {
        assert(Buffer.isBuffer(buf));
      })
    })
  })

  describe('.location', function () {
    it('should return the location', function () {
      return request('http://github.com').redirects(0).then(function (response) {
        assert.equal(response.location, 'https://github.com/')
        response.dump()
      })
    })
  })

  describe('.links', function () {
    it('should return all the links', function () {
      var app = express();
      app.use(function (req, res) {
        res.set('link', '<https://api.github.com/user/9287/repos?page=3&per_page=100>; rel="next", ' +
          '<https://api.github.com/user/9287/repos?page=1&per_page=100>; rel="prev"; pet="cat", ' +
          '<https://api.github.com/user/9287/repos?page=5&per_page=100>; rel="last"');
        res.end('test');
      })
      return new Promise(function (resolve, reject) {
        app.listen(function (err) {
          if (err) throw err;
          resolve(this.address().port);
        })
      }).then(function (port) {
        return request('http://127.0.0.1:' + port).then(function (response) {
          assert(response.links.next)
          assert(response.links.last)
          response.dump()
        })
      })
    })
  })
})
