
var assert = require('assert');

var Request = require('..');

describe('request.defaults()', function () {
  it('request()', function () {
    var request = Request.defaults({
      agent: false
    });

    var req = request('http://facebook.com');
    assert.equal(req.options.agent, false);
  })

  it('request[method]()', function () {
    var request = Request.defaults({
      agent: false
    });

    var req = request.post('http://facebook.com');
    assert.equal(req.options.method, 'POST');
    assert.equal(req.options.agent, false);
  })
})
