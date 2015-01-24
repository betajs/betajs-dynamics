BetaJS.Dynamics.HandlerPartial.extend("BetaJS.Dynamics.IgnorePartial", {
			
	constructor: function (node, args, value) {
		this._inherited(BetaJS.Dynamics.IgnorePartial, "constructor", node, args, value);
		node.deactivate();
	}
	
});

BetaJS.Dynamics.IgnorePartial.register("ba-ignore");
