Scoped.define("module:Partials.ShareScope", ["module:Handlers.Partial", "base:Objs"], function (Partial, Objs, scoped) {
 	var Cls = Partial.extend({scoped: scoped}, function (inherited) {
 		return {
			
 			bindTagHandler: function (handler) {
 				Objs.iter(this._node.properties().data(), function (value, key) {
 					handler.properties().bind(key, this._node.properties());
 				}, this); 				
 			}
 		
 		};
 	});
 	Cls.register("ba-sharescope");
	return Cls;
});
