
var http = require('http');
var assert = require('assert');
var auth = require('basic-auth');
var express = require('express');
var typer = require('media-typer');
var bodyParser = require('body-parser');
var Promise = require('any-promise');
var cookieParser = require('cookie-parser');

var request = require('..');

describe('Request', function () {
  it('(options)', function () {
    var req = request('http://localhost', {
      a: 1,
    });
    assert.equal(req.options.a, 1);
  })

  describe('.set', function () {
    it('(headers)', function () {
      var req = request('http://localhost').set({
        a: 'b'
      })
      assert.equal(req.options.headers.a, 'b')
    })

    it('(key, value)', function () {
      var req = request('http://localhost').set('a', 'b')
      assert.equal(req.options.headers.a, 'b')
    })
  })

  describe('.auth', function () {
    var app = express();
    app.use(function (req, res, next) {
      res.json(auth(req));
    })

    it('(user)', function () {
      return new Promise(function (resolve, reject) {
        app.listen(function (err) {
          if (err) throw err;
          resolve(this.address().port);
        })
      }).then(function (port) {
        return request('http://localhost:' + port)
          .auth('user')
          .then(function (response) {
            return response.json();
          })
      }).then(function (data) {
        assert.deepEqual(data, { name: 'user', pass: '' });
      })
    })

    it('(user, pass)', function () {
      return new Promise(function (resolve, reject) {
        app.listen(function (err) {
          if (err) throw err;
          resolve(this.address().port);
        })
      }).then(function (port) {
        return request('http://localhost:' + port)
          .auth('user', '1234')
          .then(function (response) {
            return response.json();
          })
      }).then(function (data) {
        assert.deepEqual(data, { name: 'user', pass: '1234' });
      })
    })

    it('(user + : + pass)', function () {
      return new Promise(function (resolve, reject) {
        app.listen(function (err) {
          if (err) throw err;
          resolve(this.address().port);
        })
      }).then(function (port) {
        return request('http://localhost:' + port)
          .auth('user:1234')
          .then(function (response) {
            return response.json();
          })
      }).then(function (data) {
        assert.deepEqual(data, { name: 'user', pass: '1234' });
      })
    })
  })

  describe('.agent', function () {
    it('()', function () {
      var req = request('http://localhost').agent();
      assert.strictEqual(req.options.agent, false);
    })

    it('(agent)', function () {
      var req = request('http://localhost').agent(new http.Agent());
      assert(req.options.agent instanceof http.Agent);
    })
  })

  describe('.timeout()', function () {
    var app = express();
    app.use(function (req, res, next) {
      setTimeout(function () {
        res.end('timeout');
      }, 5000);
    })

    it('basic', function () {
      return new Promise(function (resolve, reject) {
        app.listen(function (err) {
          if (err) throw err;
          resolve(this.address().port);
        })
      }).then(function (port) {
        return request('http://localhost:' + port)
          .timeout(5)
          .catch(function (err) {
            assert.equal(err.status, 408);
            assert.equal(err.message, 'Request Time-out');
          })
      })
    })

    it('send', function () {
      return new Promise(function (resolve, reject) {
        app.listen(function (err) {
          if (err) throw err;
          resolve(this.address().port);
        })
      }).then(function (port) {
        return request('http://localhost:' + port)
          .timeout(5)
          .send({ name: 'test' })
          .catch(function (err) {
            assert.equal(err.status, 408);
            assert.equal(err.message, 'Request Time-out');
          })
      })
    })

    it('sendFile', function () {
      return new Promise(function (resolve, reject) {
        app.listen(function (err) {
          if (err) throw err;
          resolve(this.address().port);
        })
      }).then(function (port) {
        return request('http://localhost:' + port)
          .timeout(5)
          .sendFile(__filename)
          .catch(function (err) {
            assert.equal(err.status, 408);
            assert.equal(err.message, 'Request Time-out');
          })
      })
    })
  })

  describe('.redirects', function () {
    var app = express();
    app.use(function (req, res, next) {
      var num = req.query.num | 0 || 0;
      res.redirect('/?num=' + (++num));
    })

    it('set redirects', function () {
      var req = request('http://localhost').redirects(5);
      assert.equal(req._maxRedirects, 5);
    })

    it('should not redirect', function () {
      return new Promise(function (resolve, reject) {
        app.listen(function (err) {
          if (err) throw err;
          resolve(this.address().port);
        })
      }).then(function (port) {
        return request('http://localhost:' + port).redirects(0);
      }).then(function (res) {
        assert.equal(res.statusCode, 302);
        assert.equal(res.response.redirects.length, 0);
      })
    })

    it('should redirect', function () {
      return new Promise(function (resolve, reject) {
        app.listen(function (err) {
          if (err) throw err;
          resolve(this.address().port);
        })
      }).then(function (port) {
        return request('http://localhost:' + port).redirects(5);
      }).then(function (res) {
        assert.equal(res.statusCode, 302);
        assert.deepEqual(res.response.redirects.map(function (url) {
          return url.split('?')[1];
        }), ['num=1', 'num=2', 'num=3', 'num=4', 'num=5']);
      })
    })

    it('should send and redirect', function () {
      return new Promise(function (resolve, reject) {
        app.listen(function (err) {
          if (err) throw err;
          resolve(this.address().port);
        })
      }).then(function (port) {
        return request('http://localhost:' + port)
          .redirects(5)
          .send({ name: 'test' });
      }).then(function (res) {
        assert.equal(res.statusCode, 302);
        assert.deepEqual(res.response.redirects.map(function (url) {
          return url.split('?')[1];
        }), ['num=1', 'num=2', 'num=3', 'num=4', 'num=5']);
      })
    })

    it('should sendFile and redirect', function () {
      return new Promise(function (resolve, reject) {
        app.listen(function (err) {
          if (err) throw err;
          resolve(this.address().port);
        })
      }).then(function (port) {
        return request('http://localhost:' + port)
          .redirects(5)
          .sendFile(__filename);
      }).then(function (res) {
        assert.equal(res.statusCode, 302);
        assert.deepEqual(res.response.redirects.map(function (url) {
          return url.split('?')[1];
        }), ['num=1', 'num=2', 'num=3', 'num=4', 'num=5']);
      })
    })
  })

  describe('.ifModifiedSince', function () {
    var d = new Date();

    it('(number)', function () {
      var req = request('http://localhost').ifModifiedSince(d.getTime());
      assert.equal(req.options.headers['If-Modified-Since'], d.toUTCString());
    })

    it('(string)', function () {
      var req = request('http://localhost').ifModifiedSince(d.toUTCString());
      assert.equal(req.options.headers['If-Modified-Since'], d.toUTCString());
    })

    it('(date)', function () {
      var req = request('http://localhost').ifModifiedSince(d);
      assert.equal(req.options.headers['If-Modified-Since'], d.toUTCString());
    })
  })

  it('.ifNoneMatch()', function () {
    var req = request('http://localhost').ifNoneMatch('test');
    assert.equal(req.options.headers['If-None-Match'], 'test');
  })

  describe('.type', function () {
    it('(json)', function () {
      var req = request('http://localhost').type('json');
      assert(req.headers['content-type'].match(/application\/json/));
    })
  })

  describe('.cookie', function () {
    var app = express();
    app.use(cookieParser());
    app.use(function (req, res, next) {
      res.json(req.cookies);
    })

    it('(key, value)', function () {
      return new Promise(function (resolve, reject) {
        app.listen(function (err) {
          if (err) throw err;
          resolve(this.address().port);
        })
      }).then(function (port) {
        return request('http://localhost:' + port)
          .cookie('name', 'test')
          .cookie('word', 'hello')
          .then(function (response) {
            return response.json();
          })
      }).then(function (data) {
        assert.deepEqual(data, { name: 'test', word: 'hello' });
      })
    })

    it('(key, value, options)', function () {
      return new Promise(function (resolve, reject) {
        app.listen(function (err) {
          if (err) throw err;
          resolve(this.address().port);
        })
      }).then(function (port) {
        return request('http://localhost:' + port)
          .cookie('name', 'test', { path: '/' })
          .cookie('word', 'hello', { path: '/test' })
          .then(function (response) {
            return response.json();
          })
      }).then(function (data) {
        assert.equal(data.name, 'test');
        assert.equal(data.word, 'hello');
      })
    })
  })

  it('.catch()', function () {
    return request('http://localhost').catch(function () {})
  })

  describe('.query', function () {
    var app = express();
    app.use(function (req, res, next) {
      res.json(req.query);
    })

    it('(object)', function () {
      return new Promise(function (resolve, reject) {
        app.listen(function (err) {
          if (err) throw err;
          resolve(this.address().port);
        })
      }).then(function (port) {
        return request('http://localhost:' + port)
          .query({ name: 'test' })
          .query({ word: 'hello' })
          .then(function (response) {
            return response.json();
          })
      }).then(function (data) {
        assert.deepEqual(data, { name: 'test', word: 'hello' });
      })
    })

    it('(object) and url', function () {
      return new Promise(function (resolve, reject) {
        app.listen(function (err) {
          if (err) throw err;
          resolve(this.address().port);
        })
      }).then(function (port) {
        return request('http://localhost:' + port + '?name=test')
          .query({ word: 'hello' })
          .then(function (response) {
            return response.json();
          })
      }).then(function (data) {
        assert.deepEqual(data, { name: 'test', word: 'hello' });
      })
    })
  })

  describe('.send()', function () {
    var app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(function (req, res, next) {
      res.json({
        type: req.get('Content-Type'),
        body: req.body
      });
    })

    it('should send json', function () {
      return new Promise(function (resolve, reject) {
        app.listen(function (err) {
          if (err) throw err;
          resolve(this.address().port);
        })
      }).then(function (port) {
        return request('http://localhost:' + port)
          .send({ name: 'test' })
          .send({ word: 'hello' })
          .then(function (response) {
            return response.json();
          })
      }).then(function (data) {
        assert.equal(typer.parse(data.type).subtype, 'json');
        assert.deepEqual(data.body, { name: 'test', word: 'hello' });
      })
    })

    it('should send urlencoded by send(string)', function () {
      return new Promise(function (resolve, reject) {
        app.listen(function (err) {
          if (err) throw err;
          resolve(this.address().port);
        })
      }).then(function (port) {
        return request('http://localhost:' + port)
          .send('name=test')
          .send('word=hello')
          .then(function (response) {
            return response.json();
          })
      }).then(function (data) {
        assert.equal(typer.parse(data.type).subtype, 'x-www-form-urlencoded');
        assert.deepEqual(data.body, { name: 'test', word: 'hello' });
      })
    })

    it('should send urlencoded by setting type', function () {
      return new Promise(function (resolve, reject) {
        app.listen(function (err) {
          if (err) throw err;
          resolve(this.address().port);
        })
      }).then(function (port) {
        return request('http://localhost:' + port)
          .type('application/x-www-form-urlencoded')
          .send({ name: 'test' })
          .send({ word: 'hello' })
          .then(function (response) {
            return response.json();
          })
      }).then(function (data) {
        assert.equal(typer.parse(data.type).subtype, 'x-www-form-urlencoded');
        assert.deepEqual(data.body, { name: 'test', word: 'hello' });
      })
    })

    it('should send urlencoded by setting options.headers: content-type', function () {
      return new Promise(function (resolve, reject) {
        app.listen(function (err) {
          if (err) throw err;
          resolve(this.address().port);
        })
      }).then(function (port) {
        return request('http://localhost:' + port, {
          headers: {
            'content-type': 'application/x-www-form-urlencoded'
          }
        })
          .send({ name: 'test' })
          .send({ word: 'hello' })
          .then(function (response) {
            return response.json();
          })
      }).then(function (data) {
        assert.equal(typer.parse(data.type).subtype, 'x-www-form-urlencoded');
        assert.deepEqual(data.body, { name: 'test', word: 'hello' });
      })
    })
  })

  describe('.sendFile()', function () {
    it('should send a file', function () {
      var app = express();
      app.use(function (req, res, next) {
        assert(req.is('text/*'))
        var str = '';
        req.setEncoding('utf8');
        req.on('error', function (err) {
          throw err;
        });
        req.on('data', function (chunk) {
          str += chunk;
        })
        req.on('end', function () {
          assert(~str.indexOf('requisition'))
          res.statusCode = 204;
          res.end();
        })
      })
      return new Promise(function (resolve, reject) {
        app.listen(function (err) {
          if (err) throw err;
          resolve(this.address().port);
        })
      }).then(function (port) {
        return request('http://127.0.0.1:' + port).sendFile('README.md')
      }).then(function (response) {
        assert(response.statusCode === 204);
      })
    })

    it('should support expect: 100-continue', function () {
      return new Promise(function (resolve, reject) {
        http.createServer().on('checkContinue', function (req, res) {
          res.writeContinue();
          var str = '';
          req.setEncoding('utf8');
          req.on('error', function (err) {
            throw err;
          });
          req.on('data', function (chunk) {
            str += chunk;
          })
          req.on('end', function () {
            assert(~str.indexOf('requisition'))
            res.statusCode = 204;
            res.end();
          })
        }).listen(function (err) {
          if (err) throw err;
          resolve(this.address().port)
        })
      }).then(function (port) {
        return request('http://127.0.0.1:' + port)
          .sendFile('README.md')
          .expectContinue()
      }).then(function (response) {
        assert(response.statusCode === 204);
      })
    })
  })
})
