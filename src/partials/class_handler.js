BetaJS.Dynamics.HandlerPartial.extend("BetaJS.Dynamics.ClassPartial", {
	
	_apply: function (value) {
		for (var key in value) {
			if (value[key])
				this._node._$element.addClass(key);
			else
				this._node._$element.removeClass(key);
		}
	}
	
});

BetaJS.Dynamics.handlerPartialRegistry.register("ba-class", BetaJS.Dynamics.ClassPartial);
