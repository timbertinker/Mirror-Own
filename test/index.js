'use strict';

var test = require('tape');
var hasOwn = require('hasown');
var hasProto = require('has-proto')();
var hasPropertyDescriptors = require('has-property-descriptors')();
var hasSymbols = require('has-symbols')();
var forEach = require('for-each');
var v = require('es-value-fixtures');

var mirrorOwn = require('../');

/** @type {(t: test.Test, basedir: string, mainDep: string, subDepMap: undefined | null | Record<string, unknown>, cb: (mainDepExports: unknown) => void) => void} */
function mockDep(t, _basedir, mainDep, subDepMap, cb) {
	var resolvedMainDep = require.resolve(mainDep);
	t.teardown(function () {
		delete require.cache[resolvedMainDep];
		forEach(subDepMap || { __proto__: null }, function (_, subDepName) {
			delete require.cache[require.resolve(subDepName)];
		});
	});

	forEach(subDepMap || { __proto__: null }, function (subDepExports, subDepName) {
		var subDepPath = require.resolve(subDepName);

		// eslint-disable-next-line no-extra-parens
		/** @type {NodeModule} */ (require.cache[subDepPath]).exports = subDepExports;
	});
	delete require.cache[resolvedMainDep];
	cb(require(resolvedMainDep)); // eslint-disable-line global-require
}

test('mirrorOwn', function (t) {
	t.equal(typeof mirrorOwn, 'function', 'is a function');

	forEach(hasPropertyDescriptors ? [false, true] : [false], function (useMockedGopd) {
		t.test(useMockedGopd ? 'with mocked gOPD:' : 'with native gOPD:', function (st) {
			if (useMockedGopd) {
				mockDep(st, __dirname, '../', { gopd: null }, function (mainExports) {
					// @ts-expect-error i'm intentionally reassigning an import here
					mirrorOwn = mainExports;
				});
			}

			st.test('basics', function (s2t) {
				var a = { a: 1, b: 2 };
				var b = { c: 3 };

				s2t.deepEqual(b, { c: 3 }, 'precondition');

				mirrorOwn(a, b);

				s2t.deepEqual(a, { a: 1, b: 2 }, 'does not modify A');
				s2t.deepEqual(b, { a: 1, b: 2, c: 3 }, 'mirrors own properties from A to B');

				s2t.end();
			});

			st.test('non-enumerables', function (s2t) {
				var a = [1, 2, 3];
				var b = { __proto__: null };

				s2t.ok('length' in a, '`length` is in A');
				s2t.ok(hasOwn(a, 'length'), '`length` is own property of A');
				s2t.notOk(Object.prototype.propertyIsEnumerable.call(a, 'length'), '`length` is non-enumerable in A');

				s2t.deepEqual(b, { __proto__: null }, 'precondition');

				mirrorOwn(a, b);

				s2t.deepEqual(a, [1, 2, 3], 'does not modify A');
				s2t.deepEqual(
					b,
					useMockedGopd
						? { __proto__: null, 0: 1, 1: 2, 2: 3, length: 3 }
						: { __proto__: null, 0: 1, 1: 2, 2: 3 },
					'mirrors non-enumerable properties'
				);
				s2t.ok('length' in b, 'length` is in B');
				s2t.ok(hasOwn(b, 'length'), '`length` is own property of B');

				s2t.end();
			});

			st.test('inherited enumerables', { skip: !hasProto }, function (s2t) {
				var aP = { a: 1 };
				var a = { __proto__: aP, b: 2 };
				var b = { __proto__: null };

				s2t.deepEqual(a, { __proto__: aP, b: 2 }, 'precondition');
				s2t.deepEqual(b, { __proto__: null }, 'precondition');

				mirrorOwn(a, b);

				s2t.deepEqual(a, { __proto__: aP, b: 2 }, 'does not modify A');
				s2t.deepEqual(b, { __proto__: null, b: 2 }, 'mirrors own properties from A to B');
				s2t.notOk('a' in b, 'does not mirror inherited properties');

				s2t.end();
			});

			st.test('accessor properties', { skip: !hasPropertyDescriptors || useMockedGopd }, function (s2t) {
				var a = { a: 1 };
				Object.defineProperty(a, 'b', {
					configurable: true,
					enumerable: true,
					get: function () {
						return 2;
					}
				});

				var b = { __proto__: null };

				mirrorOwn(a, b);

				s2t.deepEqual(a, { a: 1, b: 2 }, 'does not modify A');
				s2t.deepEqual(b, { __proto__: null, a: 1, b: 2 }, 'mirrors own properties from A to B');
				s2t.deepEqual(
				// eslint-disable-next-line no-extra-parens
					typeof /** @type {PropertyDescriptor} */ (Object.getOwnPropertyDescriptor(b, 'b')).get,
					'function',
					'preserves accessor property state'
				);

				s2t.end();
			});

			st.test('symbols', { skip: !hasSymbols }, function (s2t) {
				var sym = Symbol('τ');
				/** @type {Record<PropertyKey, unknown>} */
				var a = { a: 1 };
				a[sym] = 2;

				var nonEnumSym = Symbol('💩');
				Object.defineProperty(a, nonEnumSym, {
					configurable: true,
					enumerable: false,
					value: 3
				});
				var b = { __proto__: null, b: 2 };

				/** @type {Record<PropertyKey, unknown>} */
				var expectedA = { a: 1 };
				expectedA[sym] = 2;
				s2t.deepEqual(a, expectedA, 'precondition');
				s2t.ok(nonEnumSym in a, 'non-enumerable symbol is in A');

				mirrorOwn(a, b);

				/** @type {Record<PropertyKey, unknown>} */
				var expectedB = { __proto__: null, a: 1, b: 2 };
				expectedB[sym] = 2;
				expectedB[nonEnumSym] = 3;
				s2t.deepEqual(b, expectedB, 'enumerable symbols are copied to B');
				s2t.ok(sym in b, 'enumerable symbol is in B');
				s2t.ok(nonEnumSym in b, 'non-enumerable symbol is in B');

				s2t.end();
			});

			st.test('option: skipFailures', { skip: !hasPropertyDescriptors }, function (s2t) {
				var a = { a: 1, b: 2 };

				var b = { __proto__: null };
				Object.defineProperty(b, 'b', {
					configurable: false,
					enumerable: true,
					value: 3
				});

				forEach(v.nonBooleans, function (nonBoolean) {
					s2t['throws'](
					// @ts-expect-error
						function () { mirrorOwn(a, b, { skipFailures: nonBoolean }); },
						TypeError,
						'throws if `skipFailures` is not a boolean'
					);
				});

				s2t['throws'](
					function () { mirrorOwn(a, b); },
					TypeError,
					'throws if a property to override is non-configurable'
				);

				mirrorOwn(a, b, { skipFailures: true });

				s2t.deepEqual(a, { a: 1, b: 2 }, 'does not modify A');
				s2t.deepEqual(b, { __proto__: null, a: 1, b: 3 }, 'does not override non-configurable properties');

				s2t.end();
			});

			st.test('option: omit', function (s2t) {
				s2t['throws'](
					// @ts-expect-error
					function () { mirrorOwn({}, {}, { omit: null }); },
					TypeError,
					'throws if `omit` is not a function'
				);

				var a = { a: 1, b: 2 };
				var b = { __proto__: null };
				mirrorOwn(a, b, { omit: function (k) { return k === 'b'; } });

				s2t.deepEqual(a, { a: 1, b: 2 }, 'does not modify A');
				s2t.deepEqual(b, { __proto__: null, a: 1 }, 'does not mirror omitted properties');

				s2t.end();
			});
		});
	});

	t.end();
});
