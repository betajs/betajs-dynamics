Scoped.define("module:Handlers.EventPartial", ["module:Handlers.Partial"], function (Partial, scoped) {
 	var Cls = Partial.extend({scoped: scoped}, function (inherited) {
 		return {
			
 			constructor: function (node, args, value, postfix) {
 				inherited.constructor.apply(this, arguments);
 				var self = this;
 				this._node._$element.on(postfix, function () {
 					self._execute(value.trim());
 				});
 			}
 		
 		};
 	});
 	Cls.register("ba-on");
	return Cls;
});
