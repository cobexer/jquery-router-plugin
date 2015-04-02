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
 maxerr: 1000, noarg: true, undef:true, unused: true, browser: true, jquery: true, laxcomma: true */

(function($) {
	var router, routeList, routesOptimized, currentUsedUrl, $router, root;

	router = {};
	routeList = [];
	routesOptimized = true;
	$router = $(router);

	// hold the latest route that was activated
	router.currentId = "";
	router.currentParameters = {};

	function stripSlash(url) {
		if ('/' === url.charAt(url.length - 1)) {
			return url.substring(0, url.length - 1);
		}
		return url;
	}

	function stripRoot(url) {
		var result = root ? false : url;
		if (root && 0 === url.indexOf(root)) {
			result = url.substring(root.length);
		}
		return result;
	}

	root = stripSlash(location.pathname);

	// reset all routes
	router.reset = function() {
		routeList = [];
		routesOptimized = true;
		router.currentId = "";
		router.currentParameters = {};
	};

	function RegexRoute(route) {
		this._regex = route;
	}

	RegexRoute.prototype.match = function(url) {
		return url.match(this._regex);
	};

	RegexRoute.prototype.weight = function() {
		return [];
	};

	function StringRoute(route) {
		var spec = stripSlash(route), weight = [];
		// if the routes where created with an absolute url, we have to remove the absolute part anyway, since we can't change that much
		spec = spec.replace(location.protocol + "//", "").replace(location.hostname, "");
		this._parts = spec.split('/').map(function(value) {
			var result = { parameter: false, str: value };
			if (':' === value.charAt(0)) {
				result.parameter = true;
				result.str = value.substring(1);
				weight.push(0);
			}
			else {
				weight.push(1);
			}
			return result;
		});
		this._weight = weight;
	}

	StringRoute.prototype.match = function(url) {
		var currentUrlParts, matches = false, data = {};
		currentUrlParts = url.split("/");

		// first check so that they have the same amount of elements at least
		if (this._parts.length === currentUrlParts.length) {
			matches = this._parts.every(function(part, i) {
				if (part.parameter) {
					data[part.str] = decodeURI(currentUrlParts[i]);
				}
				else if (currentUrlParts[i] !== part.str) {
					return false;
				}
				return true;
			});
		}
		return matches ? data : false;
	};

	StringRoute.prototype.weight = function() {
		return this._weight;
	};

	router.chroot = function(newRoot) {
		root = stripSlash(newRoot);
	};

	router.add = function(route, id, callback) {
		var routeItem;
		routesOptimized = false;
		// if we only get a route and a callback, we switch the arguments
		if (typeof id === "function") {
			callback = id;
			id = null;
		}

		if (typeof route === "object") {
			routeItem = new RegexRoute(route);
		}
		else {
			routeItem = new StringRoute(route);
		}

		routeItem.id = id;
		routeItem.callback = callback;
		routeList.push(routeItem);
	};

	router.go = function(url, title) {
		if (history.pushState) {
			history.pushState({}, title, root + url + location.search);
		}
		checkRoutes(url);
	};

	// do a check without affecting the history
	router.check = router.redo = function() {
		// if the history api is available use the real current url; else use the remembered last used url
		var url = history.pushState ? stripRoot(location.pathname) : currentUsedUrl;
		checkRoutes(url);
	};

	// parse and wash the url to process
	function parseUrl(url) {
		return stripSlash(decodeURI(url));
	}

	function matchRoute(url) {
		var match = false;
		routeList.every(function(route) {
			var data = route.match(url);
			if (data) {
				match = {
					route: route,
					data: data
				};
				// break after first hit
				return false;
			}
			return true;
		});
		return match;
	}

	function optimizeRoutes() {
		routeList.sort(function(a, b) {
			var i, l, wa, wb, ia, ib;
			wa = a.weight();
			wb = b.weight();
			l = Math.max(wa.length, wb.length);
			for (i = 0; i < l; ++i) {
				ia = wa.length > i ? wa[i] : -1;
				ib = wb.length > i ? wb[i] : -1;
				if (ia > ib) {
					return -1;
				}
				else if (ia < ib) {
					return 1;
				}
			}
			return 0;
		});
		routesOptimized = true;
	}

	function checkRoutes(url) {
		var currentUrl, match;
		if (!routesOptimized) {
			optimizeRoutes();
		}
		currentUrl = parseUrl(url);
		match = matchRoute(currentUrl);

		if (match) {
			currentUsedUrl = url;
			router.currentId = match.route.id;
			router.currentParameters = match.data;
			match.route.callback(router.currentParameters);
		}
		else {
			$router.triggerHandler('route404', [ url ]);
		}
	}

	function handleRoutes(e) {
		if (e && e.originalEvent && e.originalEvent.state !== undefined) {
			checkRoutes(stripRoot(location.pathname));
		}
	}

	router.on = function() {
		return $router.on.apply($router, arguments);
	};

	router.off = function() {
		return $router.off.apply($router, arguments);
	};

	router.init = function(argName) {
		var args, argIdx, url, prefix;
		args = location.search.substr(1).split('&');
		argIdx = -1;
		url = null;
		prefix = argName + '=';
		args.every(function(arg, idx) {
			if (prefix === arg.substring(0, prefix.length)) {
				argIdx = idx;
				url = arg.substring(prefix.length);
				return false;
			}
			return true;
		});
		if (argIdx > -1) {
			args.splice(argIdx, 1);
			history.replaceState({}, document.title, root + '/' + url + (args.length ? ('?' + args.join('&')) : ''));
			router.check();
		}
	};

	$(window).bind("popstate", handleRoutes);
	$.router = router;
})(jQuery);
