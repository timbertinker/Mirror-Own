# mirror-own <sup>[![Version Badge][npm-version-svg]][package-url]</sup>

[![github actions][actions-image]][actions-url]
[![coverage][codecov-image]][codecov-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

[![npm badge][npm-badge-png]][package-url]

Mirror (copy) the own property descriptors from one object, onto another.

## Getting started

```sh
npm install --save mirror-own
```

## Usage/Examples

```js
const assert = require('assert');
const mirrorOwn = require('mirror-own');

const a = { a: 1, b: 2, [Symbol.toStringTag]: 'foo' };
const b = { c: 3 };

mirrorOwn(a, b);

assert.deepEqual(a, { a: 1, b: 2, [Symbol.toStringTag]: 'foo' }, 'source object unchanged');
assert.deepEqual(b, { a: 1, b: 2, c: 3, [Symbol.toStringTag]: 'foo' }, 'target object changed');
```

## Options

You may pass an optional options object as the third argument.
The available options are:

### `skipFailures`

Must be a boolean, if present.
If `true`, then non-configurable keys on `to` will be silently skipped.


### `omit`

Must be a predicate function, if present.
It will be invoked once per key of `from`, and if it returns a truthy value, that key will not be mirrored onto `to`.

## Tests

Clone the repo, `npm install`, and run `npm test`

[package-url]: https://npmjs.org/package/mirror-own
[npm-version-svg]: https://versionbadg.es/ljharb/mirror-own.svg
[deps-svg]: https://david-dm.org/ljharb/mirror-own.svg
[deps-url]: https://david-dm.org/ljharb/mirror-own
[dev-deps-svg]: https://david-dm.org/ljharb/mirror-own/dev-status.svg
[dev-deps-url]: https://david-dm.org/ljharb/mirror-own#info=devDependencies
[npm-badge-png]: https://nodei.co/npm/mirror-own.png?downloads=true&stars=true
[license-image]: https://img.shields.io/npm/l/mirror-own.svg
[license-url]: LICENSE
[downloads-image]: https://img.shields.io/npm/dm/mirror-own.svg
[downloads-url]: https://npm-stat.com/charts.html?package=mirror-own
[codecov-image]: https://codecov.io/gh/ljharb/mirror-own/branch/main/graphs/badge.svg
[codecov-url]: https://app.codecov.io/gh/ljharb/mirror-own/
[actions-image]: https://img.shields.io/endpoint?url=https://github-actions-badge-u3jn4tfpocch.runkit.sh/ljharb/mirror-own
[actions-url]: https://github.com/ljharb/mirror-own/actions
