Scoped.define("module:Dynamic", [
   	    "module:Data.Scope",
   	    "module:Handlers.HandlerMixin",
   	    "base:Objs",
   	    "module:Registries"
   	], function (Scope, HandlerMixin, Objs, Registries, scoped) {
	var Cls;
	Cls = Scope.extend({scoped: scoped}, [HandlerMixin, function (inherited) {
   		return {

		   	_notifications: {
				_activate: "__createActivate"
			},
				
			constructor: function (options) {
				this.initial = this.initial || {};
				options = Objs.extend(Objs.clone(this.initial, 1), options);
				if (!options.parent && options.parentHandler) {
					var ph = options.parentHandler;
					while (ph && !options.parent) {
						options.parent = ph.instance_of(Cls) ? ph : null;
						ph = ph._parentHandler;
					}
				}
				inherited.constructor.call(this, options);
				if (options.tagName) {
					this._tagName = options.tagName;
					this.data("tagname", this._tagName);
				}
				this.functions = this.__functions;
				this._handlerInitialize(options);
				this.__createActivate = options.create || function () {};
			}
				
		};
	}], {
		
		register: function (key, registry) {
			registry = registry || Registries.handler;
			registry.register(key, this);
			return this;
		},
		
		activate: function (options) {
			var dyn = new this(options || {element: document.body});
			dyn.activate();
			return dyn;
		}
	
	});
	return Cls;
});