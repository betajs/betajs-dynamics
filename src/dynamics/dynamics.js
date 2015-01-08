BetaJS.Scopes.Scope.extend("BetaJS.Dynamics.Dynamic", [
	BetaJS.Dynamics.HandlerMixin, 
	{
	
	constructor: function (options) {
		options = options || {};
		if (!options.parent && options._parentHandler) {
			var ph = options._parentHandler;
			while (ph && !options.parent) {
				options.parent = ph.instance_of(BetaJS.Dynamics.Dynamic) ? ph.parent() : null;
				ph = ph._parentHandler;
			}
		}
		this._inherited(BetaJS.Dynamics.Dynamic, "constructor", options);
		this.functions = this.__functions;
		this._handlerInitialize(options);
	}
		
}]);