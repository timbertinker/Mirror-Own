declare function mirrorOwn<
	F extends Record<PropertyKey, unknown> | unknown[] | Function | object,
	T extends Record<PropertyKey, unknown> | unknown[] | Function | object,
>(
	from: F,
	to: T,
	options?: {
		skipFailures?: boolean;
		omit?: (key: keyof F) => boolean;
	},
): void;

export = mirrorOwn;
