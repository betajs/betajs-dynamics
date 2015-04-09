Scoped.define("module:Handlers.EventPartial", ["module:Handlers.Partial"], function (Partial, scoped) {
 	var Cls = Partial.extend({scoped: scoped}, function (inherited) {
 		return {
			
 			constructor: function (node, args, value) {
 				inherited.constructor.apply(this, arguments);
 				var self = this;
 				var data = value.split(":");
 				this._node._$element.on(data[0].trim(), function () {
 					self._execute(data[1].trim());
 				});
 			}
 		
 		};
 	});
 	Cls.register("ba-on");
	return Cls;
});
