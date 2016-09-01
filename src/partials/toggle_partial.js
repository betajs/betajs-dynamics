Scoped.define("module:Partials.TogglePartial", ["module:Handlers.Partial"], function (Partial, scoped) {
 	var Cls = Partial.extend({scoped: scoped}, function (inherited) {
 		return {
			
 			constructor: function (node, args, value, postfix) {
 				inherited.constructor.apply(this, arguments);
 				node._$element.prop(postfix, value ? postfix : null);
 			},
 			
 			_apply: function (value) {
 				this._node._$element.prop(this._postfix, value ? this._postfix : null);
 			}
 		
 		};
 	});
 	Cls.register("ba-toggle");
	return Cls;
});
