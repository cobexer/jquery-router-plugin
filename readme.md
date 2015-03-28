# jquery router plugin
This plugin handles routes for push state with a simple api and deterministic route ordering.

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
	"/items/:item": a simple route with a parameter
	"/items/all": a simple route without any parameter
	The order in which the routes will be checked is:
	/items/all		checked first because it has 2 static parts
	/items/:item	checked second because it has 1 static part
	/\/items\/(\d+)/

Please note that the ordering between regular expression based routes is undefined.

__For more usage examples check the included tests inside the tests directory.__

### Reseting all routes

If you need to remove all routes (which is good when testing) you just call:

$.router.reset();

## License 

(The MIT License)

Copyright (c) 2011 Camilo Tapia &lt;camilo.tapia@gmail.com&gt;
Copyright (c) 2015 Christoph Obexer &lt;cobexer@gmail.com&gt;

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