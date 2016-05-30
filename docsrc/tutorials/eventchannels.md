Events Channels are a way to encapsulate message sending between dynamics. By default, there is a global channel that all dynamics can subscribe to:

```javascript
BetaJS.Dynamics.Dynamic.extend(null, {
   	channels: {
   		"global:test": function () {
   			// Execute when the event test has been triggered on the global channel
   		}
   	}
}).register("ba-receiver");

BetaJS.Dynamics.Dynamic.extend(null, {
   	functions: {
   		foobar: function () {
   			// Trigger event test on the global channel
   			this.channel("global").trigger("test");
   		}
   	}
}).register("ba-sender");
```

In some case, you might want to restrict a channel to one dynamic and all its subdynamics. To do so, you register your own channel in the parent dynamic and subscribe to it in the subdynamics:

```javascript
BetaJS.Dynamics.Dynamic.extend(null, {
	registerchannels: ["mychannel"]
}).register("ba-parent");

BetaJS.Dynamics.Dynamic.extend(null, {
   	channels: {
   		"mychannel:test": function () {
   			// Execute when the event test has been triggered within the parent dynamic mychannel
   		}
   	}
}).register("ba-childreceiver");

BetaJS.Dynamics.Dynamic.extend(null, {
   	functions: {
   		foobar: function () {
   			// Trigger event test within the parent dynamic mychannel
   			this.channel("mychannel").trigger("test");
   		}
   	}
}).register("ba-childsender");
```

