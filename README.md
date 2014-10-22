
# requisition

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Dependency Status][david-image]][david-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]
[![Gittip][gittip-image]][gittip-url]

A light, fluent node.js HTTP client for ES6.
Heavily inspired by [superagent](https://github.com/visionmedia/superagent)
as well as [fetch](https://github.com/github/fetch).
Designed with ES7 async/await in mind.

The API is quite minimal for now.
Features will be added while people request or use them.

```js
var req = require('requisition');

// GET a JSON body
async function () {
  var res = await req('/users.json');
  var body = await res.json();
}

// POST an image file
async function () {
  var res = await req.post('/images.json').sendFile('image.png');
  var body = await res.json();
}
```

## API

```js
var request = require('requisition');
```

### Request

#### request(url)

`GET` a `url`, return the response object.

#### request\[VERB\](url)

`VERB` a `url`, specifically when it's not `GET`.

#### request().then( response => )

Send the request and wait for the response.

```js
request('/').then(function (response) {

})
```

#### request().set(headers)

Set an object of headers.

#### request().set(header, value)

Set a single header.

### Response

#### response.status

The status code of the response.

#### response.headers

The header object of the response.

#### response.is(types...)

Infer the `Content-Type` of the response,
similar to Koa or Express' method.
See [type-is](https://github.com/jshttp/type-is).

#### response.get(header)

Get the value for a header.

#### response.buffer().then( buffer => )

Return a single `Buffer` for the entire response.

#### response.text().then( text => )

Return a single `String` for the entire response.

#### response.json().then( body => )

Automatically parse the JSON of the response.

```js
request('/users.json').then(function (response) {
  assert(response.status === 200, 'Bad response!');
  assert(response.is('json'), 'Bad type!');
  return response.json()
}).then(function (body) {
  console.log(body);
})
```

#### response.saveTo(filename).then( filename => )

Save the response to a file.

```js
request('/file.txt').then(function (response) {
  return response.saveTo('/tmp/file.txt');
}).then(function () {
  console.log('file saved!');
})
```

#### response.dump()

Dumps the response. Execute this if you haven't handled the body.

#### response.destroy()

Destroy the response. 

[npm-image]: https://img.shields.io/npm/v/requisition.svg?style=flat-square
[npm-url]: https://npmjs.org/package/requisition
[github-tag]: http://img.shields.io/github/tag/thenables/requisition.svg?style=flat-square
[github-url]: https://github.com/thenables/requisition/tags
[travis-image]: https://img.shields.io/travis/thenables/requisition.svg?style=flat-square
[travis-url]: https://travis-ci.org/thenables/requisition
[coveralls-image]: https://img.shields.io/coveralls/thenables/requisition.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/thenables/requisition
[david-image]: http://img.shields.io/david/thenables/requisition.svg?style=flat-square
[david-url]: https://david-dm.org/thenables/requisition
[license-image]: http://img.shields.io/npm/l/requisition.svg?style=flat-square
[license-url]: LICENSE
[downloads-image]: http://img.shields.io/npm/dm/requisition.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/requisition
[gittip-image]: https://img.shields.io/gratipay/jonathanong.svg?style=flat-square
[gittip-url]: https://gratipay.com/jonathanong/
