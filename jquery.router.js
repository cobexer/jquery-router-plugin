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
	var router = {}, routeList = [], routesOptimized = true, currentUsedUrl;

	// hold the latest route that was activated
	router.currentId = "";
	router.currentParameters = {};

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
		var match = url.match(this._regex);
		if (match) {
			return match;
		}
		return false;
	};

	RegexRoute.prototype.weight = function() {
		return -1;
	};

	function StringRoute(route) {
		var spec = route, weight = 0;
		// remove the last slash to unify all routes
		if ('/' === spec.charAt(spec.length - 1)) {
			spec = spec.substring(0, spec.length - 1);
		}

		// if the routes where created with an absolute url, we have to remove the absolute part anyway, since we can't change that much
		spec = spec.replace(location.protocol + "//", "").replace(location.hostname, "");
		this._parts = spec.split('/').map(function(value) {
			var result = { parameter: false, str: value };
			if (':' === value.charAt(0)) {
				result.parameter = true;
				result.str = value.substring(1);
			}
			else {
				++weight;
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
			history.pushState({}, title, url + location.search);
		}
		checkRoutes(url);
	};

	// do a check without affecting the history
	router.check = router.redo = function() {
		// if the history api is available use the real current url; else use the remembered last used url
		var url = history.pushState ? location.pathname : currentUsedUrl;
		checkRoutes(url);
	};

	// parse and wash the url to process
	function parseUrl(url) {
		var currentUrl = decodeURI(url);
		// if the last character is a slash, we just remove it
		if ('/' === currentUrl.charAt(currentUrl.length - 1)) {
			currentUrl = currentUrl.substring(0, currentUrl.length - 1);
		}
		return currentUrl;
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
			var wa = a.weight(), wb = b.weight();
			if (wa === wb) {
				return 0;
			}
			if (wa > wb) {
				return -1;
			}
			return 1;
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
	}

	function handleRoutes(e) {
		if (e && e.originalEvent && e.originalEvent.state !== undefined) {
			checkRoutes(location.pathname);
		}
	}

	$(window).bind("popstate", handleRoutes);
	$.router = router;
})(jQuery);
