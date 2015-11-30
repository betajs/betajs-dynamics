
Scoped.define("module:Partials.RegisterPartial", ["module:Handlers.Partial"], function (Partial, scoped) {
 	var Cls = Partial.extend({scoped: scoped}, function (inherited) {
 		return {
			
 			bindTagHandler: function (handler) {
 				handler.nameRegistry().register(handler, this._value);
 			},
 			
 			unbindTagHandler: function (handler) {
 				if (handler)
 					handler.nameRegistry().unregister(this._value);
 			}
 			
 		};
 	});
 	Cls.register("ba-register");
	return Cls;
});
