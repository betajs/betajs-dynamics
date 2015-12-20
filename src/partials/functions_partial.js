
Scoped.define("module:Partials.FunctionsPartial", ["module:Handlers.Partial", "browser:Info", "base:Objs"], function (Partial, Info, Objs, scoped) {
 	var Cls = Partial.extend({scoped: scoped}, function (inherited) {
 		return {
			
 			bindTagHandler: function (handler) { 				
 				Objs.extend(handler.__functions, this._value); 
 			}
 		
 		};
 	});
 	Cls.register("ba-functions");
	return Cls;
});
