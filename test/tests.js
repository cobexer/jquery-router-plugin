/*
	Copyright 2011  camilo tapia // 24hr (email : camilo.tapia@gmail.com)
	Copyright 2015-2017 Christoph Obexer <cobexer@gmail.com>

	This program is free software; you can redistribute it and/or modify
	it under the terms of the GNU General Public License, version 2, as
	published by the Free Software Foundation.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program; if not, write to the Free Software
	Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */
/*global jscoverage_report, QUnit */

QUnit.config.requireExpects = true;
QUnit.config.testTimeout = 1000;

if (/disableHistoryAPI/.test(location.search)) {
	history.pushState = undefined;
}

$(window).on('unload', function() {
	if (window.jscoverage_report) {
		jscoverage_report();
	}
});

$.router.init('v');

QUnit.test("simple routing", function(assert) {
	assert.expect(1);
	$.router.add('/', function() {
		assert.ok(true, "root route invoked");
	});
	$.router.go('/', 'Home');
});

QUnit.test("simple routing with parameter", function(assert) {
	assert.expect(2);
	$.router.add('/v/show/:id', function(data) {
		assert.strictEqual(data.id, "42", "url argument parsed");
		assert.strictEqual($.router.currentParameters, data, "parameters available in $.router.currentParameters");
	});
	$.router.go('/v/show/42/', 'Item 42');
});

QUnit.test("regex routing with parameter", function(assert) {
	assert.expect(4);
	$.router.add(/^\/v\/show\/(\d{4})\/([abc])_(\d)$/, function(matches) {
		assert.strictEqual(matches.length, 4, "regex argument result passed");
		assert.strictEqual(matches[1], "1337", "first capture");
		assert.strictEqual(matches[2], "b", "second capture");
		assert.strictEqual(matches[3], "9", "third capture");
	});
	$.router.go('/v/show/1337/b_9', 'Regexp URL test');
});

QUnit.test("route with id", function(assert) {
	assert.expect(2);
	$.router.add('/v/config', 'configPage', function() {
		assert.strictEqual(this.id, 'configPage', 'id of the route available');
		assert.strictEqual($.router.currentId, 'configPage', 'id of the route available in the $.router.currentId property');
	});
	$.router.go('/v/config', 'Configuration');
});

QUnit.test("routing call initiated through history.back", function(assert) {
	let index = 0;
	let done = [assert.async(), assert.async(), assert.async()];
	assert.expect(3);
	$.router.add('/v/history/:id', function(data) {
		assert.strictEqual(data.id, "" + index % 2, "url argument parsed");
		done[index]();
		++index;
		if (index < 2) {
			$.router.go('/v/history/' + index, 'History ' + index);
		}
		else {
			history.go(-1);
		}
	});
	$.router.go('/v/history/0', 'History 0');
});

QUnit.test("$.router.reset", function(assert) {
	assert.expect(2);
	$.router.add('/v/reset', $.noop);
	$.router.on('router:404', function(e, url) {
		$.router.off('router:404');
		assert.strictEqual(e.type, 'router:404', 'expected event type');
		assert.strictEqual(url, '/v/reset', 'router:404 triggered with the expected url');
	});
	$.router.reset();
	$.router.go('/v/reset', 'reset');
});

QUnit.test("routes must match with all parts", function(assert) {
	assert.expect(1);
	const fn = function() {
		assert.strictEqual(this.id, "categoryAndTag", "category and tag present, thus the route with both must match");
	};
	$.router.add('/v/parts/:category', 'categoryOnly', fn);
	$.router.add('/v/parts/:category/:tag', 'categoryAndTag', fn);
	$.router.go('/v/parts/phones/android', 'equal length route should match');
});

QUnit.test("routes must match with all parts (registration order must not affect result)", function(assert) {
	assert.expect(1);
	const fn = function() {
		assert.strictEqual(this.id, "categoryAndTag", "category and tag present, thus the route with both must match");
	};
	$.router.add('/v/parts2/:category', 'categoryOnly', fn);
	$.router.add('/v/parts2/:category/:tag', 'categoryAndTag', fn);
	$.router.go('/v/parts2/phones/android', 'equal length route should match');
});

QUnit.test("$.router.check", function(assert) {
	assert.expect(1);
	$.router.add('/v/checked', function() {
		assert.ok(true, "route for checked url invoked");
	});
	const url = location.pathname.replace(/\/v\/.*$/, '/v/checked') + location.search;
	history.pushState({}, 'Checked URL', url);
	$.router.check();
});

QUnit.test("if a $.router.go does not match anything, the current route and parameters must not be modified", function(assert) {
	let route = null;
	assert.expect(2);
	$.router.add('/v/currentRoutePersists', 'currentRoutePersists', function(data) {
		route = {
			id: this.id,
			data: data
		};
		$.router.go('/v/nowhere');
	});
	$.router.on('router:404', function() {
		$.router.off('router:404');
		assert.strictEqual(route.id, $.router.currentId, '$.router.reset cleared routes');
		assert.strictEqual(route.data, $.router.currentParameters, '$.router.reset cleared routes');
	});
	$.router.go('/v/currentRoutePersists', 'Current Route Persists if no match');
});

QUnit.test("location.search should be left intact", function(assert) {
	const oldSearch = location.search;
	assert.expect(1);
	$.router.add('/v/location/search/kept', function() {
		const currentSearch = location.search;
		history.replaceState({}, '', location.pathname + oldSearch);
		assert.strictEqual(currentSearch, "?rule34", "No exceptions.");
	});
	history.replaceState({}, '', location.pathname + "?rule34");
	$.router.go('/v/location/search/kept', 'Check location.search must be left intact');
});

QUnit.test("most specific route wins", function(assert) {
	assert.expect(5);
	let expect;
	const fn = function() {
		assert.strictEqual(this.id, expect, "checking " + expect + " on: " + location.pathname);
	};
	$.router.add(/^\/v\/specifity\/(.*)$/, 'regex', fn);
	$.router.add('/v/:specifity/:tag', 'static:parameter:parameter', fn);
	$.router.add('/v/:specifity/all', 'static:parameter:static', fn);
	$.router.add('/v/specifity/:tag', 'static:static:parameter', fn);
	$.router.add('/v/specifity/all', 'static:static:static', fn);
	expect = 'static:static:static';
	$.router.go('/v/specifity/all', 'static:static:static');
	expect = 'static:parameter:static';
	$.router.go('/v/specifity2/all', 'static:parameter:static');
	expect = 'static:static:parameter';
	$.router.go('/v/specifity/any', 'static:static:parameter');
	expect = 'static:parameter:parameter';
	$.router.go('/v/specifity2/any', 'static:parameter:parameter');
	expect = 'regex';
	$.router.go('/v/specifity/any/whatever', 'regex');
});

QUnit.test("$.router.chroot", function(assert) {
	$.router.reset();
	$.router.go('/');
	const root = location.pathname;
	assert.expect(1);
	$.router.add('/chroot', function() {
		$.router.reset();
		$.router.chroot(root);
		assert.strictEqual(location.pathname, (root + '/v/newroot/chroot').replace(/[/]+/g, '/'), 'root considered when matching routes and updathing the browser visible URL');
	});
	$.router.chroot(root + '/v/newroot/');
	$.router.go('/chroot', 'chroot(2)');
});

QUnit.test("$.router.init", function(assert) {
	$.router.reset();
	$.router.go('/');
	const root = location.pathname;
	const oldSearch = location.search;
	assert.expect(5);
	$.router.add('/v/loaded/from/argument', function() {
		const currentSearch = location.search;
		history.replaceState({}, '', location.pathname + oldSearch);
		assert.strictEqual(currentSearch, '', 'url argument used and removed from the effective url');
	});
	history.replaceState({}, 'init test', location.pathname + "?what=v/loaded/from/argument");
	$.router.init('what');
	$.router.add('/v/loaded/from/argument2', function() {
		const currentSearch = location.search;
		history.replaceState({}, '', location.pathname + oldSearch);
		assert.strictEqual(currentSearch, '?otherArg=b', 'url argument used and removed from the effective url');
	});
	history.replaceState({}, 'init test', location.pathname + "?what2=v/loaded/from/argument2&otherArg=b");
	$.router.init('what2');
	$.router.on('router:404', function() {
		history.replaceState({}, '', location.pathname + oldSearch);
		$.router.off('router:404');
		assert.ok(true, 'empty location.search with nor route for / triggers router:404');
	});
	history.replaceState({}, 'init test', root + "?what3=");
	$.router.init('what3');
	$.router.reset();
	history.replaceState({}, 'init test', location.pathname + "?what4=/v/loaded/from/argument4&otherArg=b");
	const basePath = location.pathname;
	$.router.add(/.*/, function() {
		const currentSearch = location.search;
		const currentPath = location.pathname;
		history.replaceState({}, '', location.pathname + oldSearch);
		assert.strictEqual(currentSearch, '?otherArg=b', 'url argument used and removed from the effective url');
		let path = basePath + '/v/loaded/from/argument4';
		path = path.replace(/\/[\/]+/, '/');
		assert.strictEqual(currentPath, path, 'path with no duplicated slashes');
	});
	$.router.init('what4');
});
