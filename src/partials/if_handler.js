BetaJS.Dynamics.ShowPartial.extend("BetaJS.Dynamics.IfPartial", {
	
	constructor: function (node, args, value) {
		this._inherited(BetaJS.Dynamics.IfPartial, "constructor", node, args, value);
		if (!value)
			node.deactivate();
	},
	
	_apply: function (value) {
		this._inherited(BetaJS.Dynamics.IfPartial, "_apply", value);
		if (value)
			this._node.activate();
		else
			this._node.deactivate();
	}
	
});

BetaJS.Dynamics.IfPartial.register("ba-if");
