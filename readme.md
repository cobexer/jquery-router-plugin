# jquery router plugin
This plugin handles routes for push state with a simple api and deterministic route ordering.

### Setup
Setting up your application for use of this plugin is very easy:
1) Include the this plugin.
2) Optionally call $.router.init with the name of your url argument that contains the initial route that should be displayed.
3) Profit!

### How to add routes
To add route you simply call the add function, providing it with the actual route string, an optional id, and the callback.

$.router.add(*route*, *[id]*, *callback*);

Example:

	// Adds a route for /items/:item and calls the callback when matched
	$.router.add("/items/:item", function(data) {
		console.log(data.item);
	});

or

	// Adds a route for /items/:item and calls the callback when matched, but also has
	// a reference to the routes id in $.router.currentId
	$.router.add("/items/:item", "foo", function(data) {
		console.log(data.item);
	});

### How to change urls and trigger routes
You can also change the current url to a route, and thereby triggering the route by calling *go*.

$.router.go(url, title);

Example:

	// This will change the url to http://www.foo.com/items/42 and set the title to
	// "My cool item" without reloading the page.
	// If a route has been set that matches it, it will be triggered.
	$.router.go("/items/42", "My cool item");

Routes are examined from most the specific route to least specific route:

	Consider the following routes as added (in any order):
	/\/items\/(\d+)/: a regular expression route
	"/:p1/:p2" a route with 2 parameter
	"/:type/edit" a route with a parameter as first argument
	"/items/:item": a simple route with a parameter
	"/items/all": a simple route without any parameter
	The order in which the routes will be checked is:
	/items/all			checked first because it has 2 static parts
	/items/:item		checked second because it has 1 static part
	/:type/edit			checked after the route above because of the position of the parameter
	/:p1/:p2			checked because it has 2 parameters (more than those above)
	/\/items\/(\d+)/	regular expression routes are checked last

Please note that the ordering between regular expression based routes is undefined.

__For more usage examples check the included tests inside the test directory.__

### Reseting all routes
If you need to remove all routes (which is good when testing) you just call:

$.router.reset();

### Events
In case a route attempt leads to no match the ___router:404___ event gets triggered with the url as argument:
to ease event handling $.router.on and $.router.off are aliases to jQuerys on and off functions.

	// register an event handler to respond to route misses.
	$.router.on('router:404', function(e, url) {
		console.log('No route for ' + url);
	});
	// unregister all event handlers again.
	$.router.off('router:404');

### Handling browser reloads and incoming deep links
Enabling deep links and fully supporting browser history within your application is hopefully one of the key reasons you selected this library.
Both features require server side support, your server needs to be able to respond to URL's that don't actually exist on the server, in a way
that your application can understand and turn into the correct content on the client side.
Suppose you have a ToDo application and the URL looks like this: https://example.org/my-todos/ (this is where your application, jQuery, and this plugin reside).
A user clicks on an a link on an external site like: https://example.org/my-todos/v/list/kNKHVXol/all, and to enable the deep linking your server redirects that to:
https://example.org/my-todos/?v=%2fv%2flist%2fkNKHVXol%2fall to handle this URL with jquery.router.js call ```$.router.init('v')``` v being the name of the URL argument
that contains the URL to route to. The result will look the same in the client after your application has initialized, but all your assets can be loaded using relative
URLs which is a nice bonus for applications that are also installed in an on-premises context where absolute control over URL setup is not possible.
If you have no idea how to get your server to send redirects like that and you also use Apache HTTPD check out the .htaccess file inside the test directory
because it does exactly that :).
In case you only deploy your application as a service or you have another way of handling nonexistent URLs with your web-server of choice you may need to change the root
of what $.router is going to handle, to do that call ```$.router.chroot(root)``` with the path that marks the root of what $.router should handle / modify.

## License
(The MIT License)

	Copyright (c) 2011 Camilo Tapia <camilo.tapia@gmail.com>
	Copyright (c) 2015-2017 Christoph Obexer <cobexer@gmail.com>

	Permission is hereby granted, free of charge, to any person obtaining
	a copy of this software and associated documentation files (the
	'Software'), to deal in the Software without restriction, including
	without limitation the rights to use, copy, modify, merge, publish,
	distribute, sublicense, and/or sell copies of the Software, and to
	permit persons to whom the Software is furnished to do so, subject to
	the following conditions:

	The above copyright notice and this permission notice shall be
	included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
	EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
	IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
	CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
	TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
	SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
