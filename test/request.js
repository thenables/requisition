
var http = require('http');
var assert = require('assert');
var express = require('express');
var Promise = require('native-or-bluebird');

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

  describe('.type', function () {
    it('(json)', function () {
      var req = request('http://localhost').type('json');
      assert(req.headers['content-type'].match(/application\/json/));
    })
  })

  it('.catch()', function () {
    return request('http://localhost').catch(function () {})
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
