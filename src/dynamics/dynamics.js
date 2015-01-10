BetaJS.Scopes.Scope.extend("BetaJS.Dynamics.Dynamic", [
	BetaJS.Dynamics.HandlerMixin, 
	{
	
	constructor: function (options) {
		options = options || {};
		if (!options.parent && options.parentHandler) {
			var ph = options.parentHandler;
			while (ph && !options.parent) {
				options.parent = ph.instance_of(BetaJS.Dynamics.Dynamic) ? ph : null;
				ph = ph._parentHandler;
			}
		}
		this._inherited(BetaJS.Dynamics.Dynamic, "constructor", options);
		this.functions = this.__functions;
		this._handlerInitialize(options);
	}
		
}], {
	
	register: function (key, registry) {
		registry = registry || BetaJS.Dynamics.handlerRegistry;
		registry.register(key, this);
	}

});