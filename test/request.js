
var assert = require('assert');
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

  it('.catch()', function () {
    return request('http://localhost').catch(function () {})
  })
})
