/*
    Copyright 2011  camilo tapia // 24hr (email : camilo.tapia@gmail.com)
    Copyright 2015 Christoph Obexer <cobexer@gmail.com>

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

/* jshint bitwise: true, curly: true, eqeqeq: true, forin: true, freeze: true, latedef: true,
 maxerr: 1000, noarg: true, undef:true, unused: true, browser: true, jquery: true, qunit: true */

/* global jscoverage_report */

QUnit.config.requireExpects = true;
QUnit.config.testTimeout = 1000;

if (/disableHistoryAPI/.test(location.search)) {
	history.pushState = undefined;
}

var hasHistoryAPI = !!(history.pushState);

$(window).on('unload', function() {
	if (window.jscoverage_report) {
		jscoverage_report();
	}
});

QUnit.test("simple routing", function(assert) {
	var done = assert.async();
	assert.expect(1);
	$.router.add('/', function() {
		assert.ok(true, "root route invoked");
		done();
	});
	$.router.go('/', 'Home');
});

QUnit.test("simple routing with parameter", function(assert) {
	var done = assert.async();
	assert.expect(2);
	$.router.add('/v/show/:id', function(data) {
		assert.strictEqual(data.id, "42", "url argument parsed");
		assert.strictEqual($.router.currentParameters, data, "parameters available in $.router.currentParameters");
		done();
	});
	$.router.go('/v/show/42/', 'Item 42');
});

QUnit.test("regex routing with parameter", function(assert) {
	var done = assert.async();
	assert.expect(4);
	$.router.add(/^\/v\/show\/(\d{4})\/([abc])_(\d)$/, function(matches) {
		assert.strictEqual(matches.length, 4, "regex argument result passed");
		assert.strictEqual(matches[1], "1337", "first capture");
		assert.strictEqual(matches[2], "b", "second capture");
		assert.strictEqual(matches[3], "9", "third capture");
		done();
	});
	$.router.go('/v/show/1337/b_9', 'Regexp URL test');
});

QUnit.test("route with id", function(assert) {
	var done = assert.async();
	assert.expect(2);
	$.router.add('/v/config', 'configPage', function() {
		assert.strictEqual(this.id, 'configPage', 'id of the route available');
		assert.strictEqual($.router.currentId, 'configPage', 'id of the route available in the $.router.currentId property');
		done();
	});
	$.router.go('/v/config', 'Configuration');
});

QUnit[hasHistoryAPI ? 'test' : 'skip']("routing call initiated through history.back", function(assert) {
	var index = 0, done = [assert.async(), assert.async(), assert.async()];
	assert.expect(3);
	$.router.add('/v/history/:id', function(data) {
		assert.strictEqual(data.id, "" + (index % 2), "url argument parsed");
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
	var done = assert.async(), routeCleared = true;
	assert.expect(1);
	$.router.add('/v/reset', function() {
		routeCleared = false;
	});
	window.setTimeout(function() {
		assert.strictEqual(routeCleared, true, '$.router.reset cleared routes');
		done();
	}, 50);
	$.router.reset();
	$.router.go('/v/reset', 'reset');
});

QUnit.test("routes must match with all parts", function(assert) {
	var done = assert.async(), fn;
	assert.expect(1);
	fn = function() {
		assert.strictEqual(this.id, "categoryAndTag", "category and tag present, thus the route with both must match");
		done();
	};
	$.router.add('/v/parts/:category', 'categoryOnly', fn);
	$.router.add('/v/parts/:category/:tag', 'categoryAndTag', fn);
	$.router.go('/v/parts/phones/android', 'equal length route should match');
});

QUnit.test("routes must match with all parts (registration order must not affect result)", function(assert) {
	var done = assert.async(), fn;
	assert.expect(1);
	fn = function() {
		assert.strictEqual(this.id, "categoryAndTag", "category and tag present, thus the route with both must match");
		done();
	};
	$.router.add('/v/parts2/:category', 'categoryOnly', fn);
	$.router.add('/v/parts2/:category/:tag', 'categoryAndTag', fn);
	$.router.go('/v/parts2/phones/android', 'equal length route should match');
});

QUnit[hasHistoryAPI ? 'test' : 'skip']("$.router.check", function(assert) {
	var done = assert.async();
	assert.expect(1);
	$.router.add('/v/checked', function() {
		assert.ok(true, "route for checked url invoked");
		done();
	});
	history.pushState({}, 'Checked URL', '/v/checked' + location.search);
	$.router.check();
});

QUnit[hasHistoryAPI ? 'skip' : 'test']("$.router.check (legacy browsers without history.pushState)", function(assert) {
	var done = [assert.async(), assert.async()], idx = 0;
	assert.expect(2);
	$.router.add('/v/checked', function() {
		assert.ok(true, "route for checked url invoked");
		done[idx++]();
		setTimeout(function() {
			$.router.check();
		}, 50);
	});
	$.router.go('/v/checked', 'Checked URL');
});

QUnit.test("if a $.router.go does not match anything, the current route and parameters must not be modified", function(assert) {
	var done = assert.async(), route = null;
	assert.expect(2);
	$.router.add('/v/currentRoutePersists', 'currentRoutePersists', function(data) {
		route = {
			id: this.id,
			data: data
		};
		$.router.go('/v/nowhere');
	});
	window.setTimeout(function() {
		assert.strictEqual(route.id, $.router.currentId, '$.router.reset cleared routes');
		assert.strictEqual(route.data, $.router.currentParameters, '$.router.reset cleared routes');
		done();
	}, 50);
	$.router.go('/v/currentRoutePersists', 'Current Route Persists if no match');
});

QUnit[hasHistoryAPI ? 'test' : 'skip']("location.search should be left intact", function(assert) {
	var done = assert.async(), oldSearch = location.search;
	assert.expect(1);
	$.router.add('/v/location/search/kept', function() {
		var currentSearch = location.search;
		history.replaceState({}, '', location.pathname + oldSearch);
		assert.strictEqual(currentSearch, "?rule34", "No exceptions.");
		done();
	});
	history.replaceState({}, '', location.pathname + "?rule34");
	$.router.go('/v/location/search/kept', 'Check location.search must be left intact');
});

QUnit.test("most specific route wins", function(assert) {
	var done = assert.async();
	assert.expect(1);
	$.router.add('/v/specifity/:tag', function() {
		assert.ok(false, "parameterized route should loose");
		done();
	});
	$.router.add('/v/specifity/all', function() {
		assert.ok(true);
		done();
	});
	$.router.go('/v/specifity/all', 'static route should win over parametered route');
});
