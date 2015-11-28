
Scoped.define("module:Partials.AssocPartial", ["module:Handlers.Partial"], function (Partial, scoped) {
 	var Cls = Partial.extend({scoped: scoped}, function (inherited) {
 		return {
			
 			constructor: function (node, args, value, postfix) {
 				inherited.constructor.apply(this, arguments);
 				this.__postfix = postfix;
 				this._node._handler.addAssoc(postfix, value); 
 			},
 			
 			destroy: function () {
 				this._node._handler.removeAssoc(this.__postfix);
 				inherited.destroy.call(this);
 			}
 			
 		};
 	});
 	Cls.register("ba-assoc");
	return Cls;
});
