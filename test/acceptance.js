
var assert = require('assert');
var request = require('..');

describe('Acceptance Tests', function () {
  it.skip('GET http://github.com', function () {
    return request('http://github.com').then(function (response) {
      assert.equal(response.status, 301);
      return response.text();
    })
  })

  it('GET https://github.com', function () {
    return request('https://github.com').then(function (response) {
      assert(response.get('content-encoding') === 'gzip')
      assert.equal(response.status, 200);
      assert(response.is('html'));
      assert(response.is('html', 'json') === 'html');
      return response.text();
    }).then(function (string) {
      assert(typeof string === 'string');
      assert(string.trim().indexOf('<!DOCTYPE html>') === 0)
    })
  })

  it('HEAD http://github.com', function () {
    return request.head('http://github.com').redirects(0).then(function (response) {
      assert.equal(response.status, 301);
    })
  })
})
