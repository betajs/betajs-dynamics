Scoped.define("module:Handlers.IgnorePartial", ["module:Handlers.Partial"], function (Partial, scoped) {
 	var Cls = Partial.extend({scoped: scoped}, function (inherited) {
 		return {
			
 			constructor: function (node, args, value) {
 				inherited.constructor.apply(this, arguments);
 				node.deactivate();
 			}
 		
 		};
 	});
 	Cls.register("ba-ignore");
	return Cls;
});
