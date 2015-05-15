Scoped.define("module:Handlers.AttrsPartial", ["module:Handlers.Partial"], function (Partial, scoped) {
 	var Cls = Partial.extend({scoped: scoped}, {
		
		_apply: function (value) {
			for (var key in value)
				this._node.properties().set(key, value[key]);
		}

 	});
 	Cls.register("ba-attrs");
	return Cls;
});
