BetaJS.Scopes.Scope.extend("BetaJS.Dynamics.Dynamic", [
	BetaJS.Dynamics.HandlerMixin, 
	{
	
	constructor: function (options) {
		options = BetaJS.Objs.extend(this.initial, options);
		if (!options.parent && options.parentHandler) {
			var ph = options.parentHandler;
			while (ph && !options.parent) {
				options.parent = ph.instance_of(BetaJS.Dynamics.Dynamic) ? ph : null;
				ph = ph._parentHandler;
			}
		}
		this._inherited(BetaJS.Dynamics.Dynamic, "constructor", options);
		if (options.tagName) {
			this._tagName = options.tagName;
			this.data("tagname", this._tagName);
		}
		this.functions = this.__functions;
		this._handlerInitialize(options);
		if (options.create)
			options.create.apply(this);
	}
		
}], {
	
	register: function (key, registry) {
		registry = registry || BetaJS.Dynamics.handlerRegistry;
		registry.register(key, this);
	},
	
	activate: function (options) {
		var dyn = new this(options || {element: document.body});
		dyn.activate();
		return dyn;
	}

});