BetaJS.Dynamics.HandlerPartial.extend("BetaJS.Dynamics.ShowPartial", {
	
	_apply: function (value) {
		if (value)
			this._node._$element.show();
		else
			this._node._$element.hide();
	}
	
});

BetaJS.Dynamics.ShowPartial.register("ba-show");