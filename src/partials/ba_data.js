
Scoped.define("module:Partials.DataPartial", ["module:Handlers.Partial"], function (Partial, scoped) {
  	var Cls = Partial.extend({scoped: scoped}, function (inherited) {
 		return {
			
 			_apply: function (value) {
 				this._node._tagHandler.data(this.__postfix, value);
 			},
 			
 			bindTagHandler: function (handler) {
 				this._apply(this._value);
 			},

 			constructor: function (node, args, value, postfix) {
 				inherited.constructor.apply(this, arguments);
 				this.__postfix = postfix;
 			}
 		
 		};
 	});
 	Cls.register("ba-data");
	return Cls;
});
