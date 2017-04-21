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

(function($) {
	"use strict";
	const router = {};
	const routeList = [];
	let routesOptimized = true;
	const $router = $(router);
	let root;
	let currentUsedUrl;

	// hold the latest route that was activated
	router.currentId = "";
	router.currentParameters = {};

	function stripSlash(url) {
		let u = url.replace(/[/]+/g, '/'); // normalize multiple consecutive slashes to a single slash
		if ('/' === u.charAt(u.length - 1)) {
			u = u.substring(0, u.length - 1);
		}
		return u;
	}

	function stripRoot(url) {
		let result = root ? false : url;
		if (root && 0 === url.indexOf(root)) {
			result = url.substring(root.length);
		}
		return result;
	}

	root = stripSlash(location.pathname);

	// reset all routes
	router.reset = function() {
		routeList.splice(0, routeList.length);
		routesOptimized = true;
		router.currentId = "";
		router.currentParameters = Object.create(null);
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
		let spec = stripSlash(route);
		// if the routes where created with an absolute url, we have to remove the absolute part anyway, since we can't change that much
		spec = spec.replace(location.protocol + "//", "").replace(location.hostname, "");
		let weight = [];
		this._parts = spec.split('/').map(function(value) {
			let result = {
				parameter: false,
				str: value,
			};
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
		let matches = false;
		let data = Object.create(null);
		const currentUrlParts = url.split("/");
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
		routesOptimized = false;
		let routeItem;
		if (typeof route === "object") {
			routeItem = new RegexRoute(route);
		}
		else {
			routeItem = new StringRoute(route);
		}
		// if we only get a route and a callback, we switch the arguments
		if (typeof id === "function") {
			routeItem.id = null;
			routeItem.callback = id;
		}
		else {
			routeItem.id = id;
			routeItem.callback = callback;
		}
		routeList.push(routeItem);
	};

	function matchRoute(url) {
		let match = false;
		routeList.every(function(route) {
			const data = route.match(url);
			if (data) {
				match = {
					route: route,
					data: data,
				};
			}
			// break after first hit
			return !data;
		});
		return match;
	}

	function optimizeRoutes() {
		routeList.sort(function(a, b) {
			const wa = a.weight();
			const wb = b.weight();
			const l = Math.max(wa.length, wb.length);
			for (let i = 0; i < l; ++i) {
				const ia = wa.length > i ? wa[i] : -1;
				const ib = wb.length > i ? wb[i] : -1;
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
		if (!routesOptimized) {
			optimizeRoutes();
		}
		const currentUrl = stripSlash(decodeURI(url));
		const match = matchRoute(currentUrl);

		if (match) {
			currentUsedUrl = url;
			router.currentId = match.route.id;
			router.currentParameters = match.data;
			$router.triggerHandler('router:match', [ url, router.currentId, router.currentParameters ]);
			match.route.callback(router.currentParameters);
		}
		else {
			$router.triggerHandler('router:404', [ url ]);
		}
	}

	router.go = function(url, title) {
		if (history.pushState) {
			history.pushState({}, title || '', root + url + location.search);
		}
		checkRoutes(url);
	};

	// do a check without affecting the history
	router.check = router.redo = function() {
		// if the history api is available use the real current url; else use the remembered last used url
		const url = history.pushState ? stripRoot(location.pathname) : currentUsedUrl;
		checkRoutes(url);
	};

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
		const args = location.search.substr(1).split('&');
		const prefix = argName + '=';
		args.every(function(arg, idx) {
			const matches = prefix === arg.substring(0, prefix.length);
			if (matches) {
				args.splice(idx, 1);
				history.replaceState({}, document.title, root + '/' + stripSlash(arg.substring(prefix.length)) + (args.length ? '?' + args.join('&') : ''));
			}
			return !matches;
		});
		router.check();
	};

	$(window).bind("popstate", handleRoutes);
	$.router = router;
}(jQuery));
