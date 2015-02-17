BetaJS.Dynamics.HandlerPartial.extend("BetaJS.Dynamics.ShowPartial", {
	
	constructor: function (node, args, value) {
		this._inherited(BetaJS.Dynamics.ShowPartial, "constructor", node, args, value);
		if (!value)
			node._$element.hide();
	},
	
	_apply: function (value) {
		if (value)
			this._node._$element.show();
		else
			this._node._$element.hide();
	}
	
});

BetaJS.Dynamics.ShowPartial.register("ba-show");