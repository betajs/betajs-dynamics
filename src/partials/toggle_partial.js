Scoped.define("module:Partials.TogglePartial", ["module:Handlers.Partial"], function (Partial, scoped) {
	var mapping = {
		readonly: "readOnly",
		playsinline: "playsInline"
	};
	
 	var Cls = Partial.extend({scoped: scoped}, function (inherited) {
 		return {
 			
 			constructor: function (node, args, value, postfix) {
 				inherited.constructor.apply(this, arguments);
 				this._apply(value);
 			},
 			
 			_apply: function (value) {
 				this._node.element()[mapping[this._postfix] || this._postfix] = value ? this._postfix : null;
 			}
 		
 		};
 	});
 	Cls.register("ba-toggle");
	return Cls;
});
