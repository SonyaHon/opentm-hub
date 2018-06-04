const HUB = require('./hub');

/**
 *
 * This is just a test file
 * Itll need proper packing for distribution
 *
 */

let hub = new HUB({
	config: {
		port: 8080,
		host: "127.0.0.1",
		path: "/",
		strict: true
	}
});

hub.Start();