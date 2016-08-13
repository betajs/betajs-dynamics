Scoped.define("module:Partials.EventPartial", [
    "module:Handlers.Partial"
], function (Partial, scoped) {
  	var Cls = Partial.extend({scoped: scoped}, {
			
		bindTagHandler: function (handler) {
			handler.on(this._postfix, function () {
				this._valueExecute(arguments);
			}, this);
		}
 		
 	});
 	Cls.register("ba-event");
	return Cls;
});
