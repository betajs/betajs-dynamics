Scoped.define("module:Partials.EventPartial", ["module:Handlers.Partial"], function (Partial, scoped) {
  	var Cls = Partial.extend({scoped: scoped}, function (inherited) {
 		return {
			
 			bindTagHandler: function (handler) {
 				handler.on(this.__postfix, function (arg1, arg2, arg3, arg4) {
 					this._node._handler.call(this._value, arg1, arg2, arg3, arg4);
 				}, this);
 			},

 			constructor: function (node, args, value, postfix) {
 				inherited.constructor.apply(this, arguments);
 				this.__postfix = postfix;
 			}
 		
 		};
 	});
 	Cls.register("ba-event");
	return Cls;
});
