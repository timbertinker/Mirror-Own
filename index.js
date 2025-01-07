'use strict';

var defineDataProperty = require('define-data-property');
var defineAccessorProperty = require('define-accessor-property');
var gOPD = require('gopd');
var ownKeys = require('own-keys');
var $TypeError = require('es-errors/type');

var empty = { __proto__: null };

/** @type {import('.')} */
module.exports = gOPD
	? function mirrorOwn(from, to) {
		var options = arguments.length > 2 ? arguments[2] : empty;
		if ('skipFailures' in options && typeof options.skipFailures !== 'boolean') {
			throw new $TypeError('`skipFailures` option must be a boolean, if present');
		}
		var skipFailures = !!options.skipFailures;
		if ('omit' in options && typeof options.omit !== 'function') {
			throw new $TypeError('`omit` option must be a function, if present');
		}
		var omit = options.omit;

		var keys = ownKeys(from);
		for (var i = 0; i < keys.length; i += 1) {
			var k = keys[i];
			if (omit && omit(k)) {
				continue; // eslint-disable-line no-continue, no-restricted-syntax
			}
			// eslint-disable-next-line no-extra-parens
			var desc = /** @type {PropertyDescriptor} */ (/** @type {NonNullable<typeof gOPD>} */ (gOPD)(from, k));
			if (k in to) {
				// @ts-expect-error
				// eslint-disable-next-line no-extra-parens
				var toDesc = /** @type {NonNullable<typeof gOPD>} */ (gOPD)(to, k);
				if (toDesc && !toDesc.configurable && skipFailures) {
					continue; // eslint-disable-line no-continue, no-restricted-syntax
				}
			}
			if ('writable' in desc) {
				defineDataProperty(
					// eslint-disable-next-line no-extra-parens
					/** @type {Parameters<typeof defineDataProperty>[0]} */ (to),
					k,
					desc.value,
					!desc.enumerable,
					!desc.configurable,
					!desc.writable,
					true
				);
			} else {
				defineAccessorProperty(
					// eslint-disable-next-line no-extra-parens
					/** @type {Parameters<typeof defineAccessorProperty>[0]} */ (to),
					k,
					{
						nonEnumerable: !desc.enumerable,
						nonConfigurable: !desc.configurable,
						// eslint-disable-next-line no-extra-parens
						get: /** @type {NonNullable<typeof desc.get>} */ (desc.get),
						// eslint-disable-next-line no-extra-parens
						set: /** @type {NonNullable<typeof desc.set>} */ (desc.set),
						loose: true
					}
				);
			}
		}
	}
	: function mirrorOwn(from, to) {
		var options = arguments.length > 2 ? arguments[2] : empty;
		if ('skipFailures' in options && typeof options.skipFailures !== 'boolean') {
			throw new $TypeError('`skipFailures` option must be a boolean');
		}
		if ('omit' in options && typeof options.omit !== 'function') {
			throw new $TypeError('`omit` option must be a function, if present');
		}
		var omit = options.omit;

		var keys = ownKeys(from);
		for (var i = 0; i < keys.length; i += 1) {
			var k = keys[i];
			if (omit && omit(k)) {
				continue; // eslint-disable-line no-continue, no-restricted-syntax
			}

			try {
				// @ts-expect-error no idea how to fix this one
				to[k] = from[k]; // eslint-disable-line no-param-reassign
			} catch (e) {
				var skipFailures = !!options.skipFailures;
				if (!skipFailures) {
					throw e;
				}
			}
		}
	};
