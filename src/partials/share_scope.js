Scoped.define("module:Partials.ShareScope", ["module:Handlers.Partial"], function (Partial, scoped) {
 	var Cls = Partial.extend({scoped: scoped}, function (inherited) {
 		return {
			
 			bindTagHandler: function (handler) {
 				handler.properties().bind("", this._value ? this._value : this._node.properties(), {deep: true});
 			}
 		
 		};
 	});
 	Cls.register("ba-sharescope");
	return Cls;
});
