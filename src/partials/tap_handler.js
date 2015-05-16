Scoped.define("module:Handlers.TapPartial", ["module:Handlers.Partial", "browser:Info"], function (Partial, Info, scoped) {
 	var Cls = Partial.extend({scoped: scoped}, function (inherited) {
 		return {
			
 			constructor: function (node, args, value) {
 				inherited.constructor.apply(this, arguments);
 				var self = this;
 				this._node._$element.on(Info.isMobile() ? "touchstart" : "click", function () {
 					self._execute();
 				});
 			}
 		
 		};
 	});
 	Cls.register("ba-tap");
	return Cls;
});
