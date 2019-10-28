const qs = require("querystring");
const debug = require("debug")("rad:core:utils");

const types = require("./types");
const contants = require("./constants");
const reducers = require("./reducers");

// This is for all the marbels
// const pipe = (...fns) => x => fns.reduce(async (v, f) => (v instanceof Promise ? f(await v) : f(v)), x);
const pipeAsync = (...fns) => x => {
	try {
		// passthrough
		if (fns.length === 0) {
			return fn => fn;
		}
		return fns.reduce(async (v, f) => {
			return types.isPromise(v) ? f(await v) : f(v);
		}, x);
	} catch (e) {
		console.error("Error caught by pipeAsync()");
		console.error(e);
		throw e;
	}
};

const pipeSync = (...fns) => x => fns.reduce((v, f) => f(v), x);

/**
 * ==========================
 * Helpers
 * ==========================
 */

const filter = predicate => array => {
	if (!Array.isArray(array)) {
		return array;
	}
	let index = -1;
	let resIndex = 0;
	const length = array == null ? 0 : array.length;
	const result = [];

	while (++index < length) {
		const value = array[index];
		if (predicate(value, index, array)) {
			result[resIndex++] = value;
		}
	}
	return result;
};

const map = transformer => array => {
	if (!Array.isArray(array)) {
		return array;
	}
	let index = -1;
	const length = array == null ? 0 : array.length;
	const result = new Array(length);

	while (++index < length) {
		result[index] = transformer(array[index], index, array);
	}
	return result;
};

const buildURL = ({ base = "", path = "", params = null }) => {
	const isAbsolute = urlStr => /^https?:\/\/|^\/\//i.test(urlStr);
	const addParams = (urlStr, queryStr) => {
		// strip out the hash
		let hashIndex = urlStr.indexOf("#");
		if (hashIndex !== -1) {
			urlStr = urlStr.slice(0, hashIndex);
		}

		let start = urlStr.indexOf("?") > -1 ? "&" : "?";
		return `${urlStr}${start}${qs.stringify(queryStr)}`;
	};
	let fullURL = "";
	// config.url is absolute, ignore the baseURL
	if (isAbsolute(path)) {
		fullURL = path;
	}
	// config.url is just relative path
	else {
		// there is a valid base URL
		if (isAbsolute(base)) {
			// console.log("base is absolute");
			if (base && base.trim().endsWith("/")) {
				base = base.slice(0, -1);
			}
			if (path && path.trim().startsWith("/")) {
				path = path.replace(/^\/+/, "");
			}

			fullURL = `${base}/${path}`;
		}
		// No absolute config.baseURL or config.url, so throw an error
		else {
			throw new Error("Must provide an absolute URL");
		}
	}

	if (types.isObject(params)) {
		return addParams(fullURL, params);
	}

	return fullURL;
};

module.exports = {
	pipe: pipeAsync,
	pipeSync,
	filter,
	map,
	...types,
	...contants,
	...reducers,
	buildURL
};