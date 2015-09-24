import * as x11 from 'x11';
import * as _ from 'lodash';

function getWindowProperty(X, wid, propertyId) {
	//console.log("A:", wid, propertyId);
	return new Promise(function(resolve, reject) {
		//console.log("B:");
		X.GetProperty(0, wid, propertyId, 0, 0, 10000000, function(err, result) {
			//console.log("C:", err, result);
			if (err) return reject(err);
			resolve(result);
		});
	});
}

function getAtomName(X, propertyId) {
	return new Promise((resolve, reject) => {
		X.GetAtomName(propertyId, function(err, result) {
			if (err) return reject(err);
			resolve(result);
		});
	});
}

x11.createClient((err, display) => {
    const X = display.client;

    function quotize(i) { return '\"' + i + '\"'; }
    function decodeProperty(type, data) {
		return new Promise((resolve, reject) => {
			switch(type) {
				case 'STRING':
					var result = [];
					var s = '';
					for (var i=0; i < data.length; ++i)
					{
						if (data[i] == 0) {
						   result.push(s);
						   s = '';
						   continue;
						}
						s += String.fromCharCode(data[i]);
					}
					result.push(s);
					return resolve(result);

				case 'ATOM':
					var numAtoms = data.length/4;
					var res = [];
					for (var i=0; i < data.length; i+=4) {
						var a = data.unpack('L', i)[0];
						X.GetAtomName(a, function(err, str) {
						   res.push(str);
						   if (res.length === numAtoms)
							   resolve(res);
						});
					}
					return;

				case 'INTEGER':
					var numAtoms = data.length/4;
					var res = [];
					for (var i=0; i < data.length; i+=4) {
						res.push(data.unpack('L', i)[0]);
					}
					return resolve(res);

				case 'WINDOW':
					var numAtoms = data.length/4;
					var res = [];
					for (var i=0; i < data.length; i+=4) {
						res.push(data.unpack('L', i)[0]);
					}
					return resolve(res);

				default:
					return resolve('???:' + type);
			}
		});
    }

    var id = parseInt(process.argv[2]);
    var root = display.screen[0].root;
	/*
    X.ListProperties(id, (err, props) => {
        props.forEach((p) => {
            X.GetProperty(0, id, p, 0, 0, 10000000, function(err, propValue) {
                X.GetAtomName(propValue.type, function(err, typeName) {
                    X.GetAtomName(p, function(err, propName) {
                        decodeProperty(typeName, propValue.data, function(decodedData) {
                            console.log(p + ': ' + propName + '(' + typeName + ') = ' + decodedData);
                        });
                    });
                });
            });
        })
    });
	*/
	X.ListProperties(id, (err, props) => {
		const promises = props.map(p => {
			//console.log(p);
			return getWindowProperty(X, id, p).then(propValue => {
				//console.log("propValue: "+propValue);
				return getAtomName(X, propValue.type).then(typeName => {
					return getAtomName(X, p).then(propName => {
						return decodeProperty(typeName, propValue.data).then(decodedData => {
							//console.log("decoded: "+decodedData);
							//console.log(p + ': ' + propName + '(' + typeName + ') = ' + decodedData);
							return [propName, decodedData];
						});
					});
				});
			});
		});

		console.log("A:");
		console.log(promises[0]);

		Promise.all(promises).then(pairs => {
			console.log("pairs:");
			console.log(pairs);
			console.log("YO!!!!!!!!!!!");
			const obj = _.zipObject(pairs);
			console.log(JSON.stringify(obj, null, '\t'));
			//pairs.forEach(s => { console.log("|"+s); });

		});
	});
	X.on('event', console.log);
	X.on('error', console.error);
});

