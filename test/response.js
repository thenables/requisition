
var tmpdir = require('os').tmpdir();
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
    var filename = join(tmpdir, Math.random().toString(36).slice(2));
    return request('http://ip.jsontest.com/').then(function (response) {
      return response.saveTo(filename);
    }).then(function () {
      return fs.statSync(filename);
    })
  })
})
