BetaJS.Dynamics.HandlerPartial.extend("BetaJS.Dynamics.ReturnPartial", {
	
	constructor: function (node, args, value) {
		this._inherited(BetaJS.Dynamics.ReturnPartial, "constructor", node, args, value);
		var self = this;
		this._node._$element.on("keypress", function (event) {
			if (event.which === 13)
				self._execute();
		});        
	}
		
});

BetaJS.Dynamics.ReturnPartial.register("ba-return");
