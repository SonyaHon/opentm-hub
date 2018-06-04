const RPC = require('node-json-rpc');
const EventEmmitter = require('events');

class HUB extends EventEmmitter {
	constructor(props) {
		super();
		this.__registeredServices = {};
		this.rpcServer = new RPC.Server(props.config);
		this.rpcServer.addMethod('attachService', (params, clb) => {
			if(params.serviceName && !this.__registeredServices[params.serviceName]) {
				this.__registeredServices[params.serviceName] = new RPC.Client(params.config);
				this.__registeredServices[params.serviceName].cfg = params.config;
				this.__registeredServices[params.serviceName].info = params.info;
				this.__registeredServices[params.serviceName].id = 0;
				this.__registeredServices[params.serviceName].getID = function(  ) {
					return (params.serviceName + '__') + this.id++;
				};
				console.log(`Service ${params.serviceName} has connected`);
				clb(undefined, 'Service registered');
			}
			else if(params.serviceName && this.__registeredServices[params.serviceName]) {
				if(this.__registeredServices[params.serviceName].cfg === params.config) {
					console.log(`Service ${params.serviceName} has reconnected`);
					clb(undefined, 'Service reconnected');
				}
			}
			else {
				clb({
					err: 'IDK WTF',
					info: 'Service with this name was already connected or there were problems with data transmission'
				});
			}
		});
		this.rpcServer.addMethod('doServiceExists', (params, clb) => {
			if(this.__registeredServices[params.serviceName]) {
				clb(undefined, true);
			}
			else {
				clb(undefined, false);
			}
		});
		this.rpcServer.addMethod('getServices', (params, clb) => {
			clb(undefined, Object.keys(this.__registeredServices));
		});
		this.rpcServer.addMethod('getServiceInfo', (params, clb) => {
			if(this.__registeredServices[params.serviceName]) {
				clb(undefined, this.__registeredServices[params.serviceName].info);
			}
			else {
				clb({
					err: 'IDK WTF',
					info: 'There is no registered service with this name'
				});
			}
		});
		this.rpcServer.addMethod('callMethod', (params, clb) => {
			if(this.__registeredServices[params.serviceName]) {
				this.__registeredServices[params.serviceName].call(
					{ "jsonrpc": "2.0", "method": params.method, "params": params.params, "id": this.__registeredServices[params.serviceName].getID()}, (err, result) => {
						clb(err, result);
					}
				)
			}
			else {
				clb({
					err: 'IDK WTF',
					info: 'There is no registered service with this name'
				});
			}
		});
	}
	Start() {
		this.rpcServer.start((err) => {
			if(err) throw err;
			console.log('Hub started!');
		});
		// Set up the pin server to check serviess for alive and kill them if they are not
		// Services are pingged with an interval of 30 secs
		setInterval(() => {
			Object.keys(this.__registeredServices).forEach((serviceName) => {
				let serv = this.__registeredServices[serviceName];
					serv.call( {
						"jsonrpc": "2.0",
						"method": "ping",
						"params": undefined,
						"id": this.__registeredServices[ serviceName ].getID()
					}, ( err, result ) => {
							if(err || !result.result) {
								console.log(`Service ${serviceName} is not alive`);
								delete this.__registeredServices[serviceName];
							}
					} );
			});
		}, 30000);
	}
}

module.exports = HUB;
