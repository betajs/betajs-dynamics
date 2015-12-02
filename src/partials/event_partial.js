Scoped.define("module:Partials.EventPartial", ["module:Handlers.Partial"], function (Partial, scoped) {
  	var Cls = Partial.extend({scoped: scoped}, {
			
		bindTagHandler: function (handler) {
			handler.on(this._postfix, function (arg1, arg2, arg3, arg4) {
				this._node._handler.call(this._value, arg1, arg2, arg3, arg4);
			}, this);
		}
 		
 	});
 	Cls.register("ba-event");
	return Cls;
});
