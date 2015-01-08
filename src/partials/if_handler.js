BetaJS.Dynamics.HandlerPartial.extend("BetaJS.Dynamics.IfPartial", {
	
	_apply: function (value) {
		if (value)
			this._node.activate();
		else
			this._node.deactivate();
	}
	
});

BetaJS.Dynamics.IfPartial.register("ba-if");
