BetaJS.Dynamics.HandlerPartial.extend("BetaJS.Dynamics.ClickPartial", {
	
	constructor: function (node, args, value) {
		this._inherited(BetaJS.Dynamics.ClickPartial, "constructor", node, args, value);
		var self = this;
		this._node._$element.on("click", function () {
			self._execute();
		});
	}
		
});

BetaJS.Dynamics.handlerPartialRegistry.register("ba-click", BetaJS.Dynamics.ClickPartial);
