
Scoped.define("module:Partials.PropPartial", [
	"module:Handlers.Partial"
], function (Partial, Events, scoped) {
 	var Cls = Partial.extend({scoped: scoped}, function (inherited) {
 		return {
			
 			_apply: function (value) {
 				this._node.element()[this._postfix] = value;
 			} 		
 		};
 	});
 	Cls.register("ba-prop");
	return Cls;
});
