import * as x11 from 'x11';
import getWindowProperties from './getWindowProperties.js';
//const getWindowProperties = require('./getWindowProperties.js');

x11.createClient((err, display) => {
    const X = display.client;

    var id = parseInt(process.argv[2]);
    var root = display.screen[0].root;
	getWindowProperties(X, id).then(obj => {
		console.log(JSON.stringify(obj, null, '\t'));
	}).catch(e => {console.log("ERROR: "+e) });
	X.on('event', console.log);
	X.on('error', console.error);
});

