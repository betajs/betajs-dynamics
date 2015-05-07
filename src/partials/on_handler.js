Scoped.define("module:Handlers.EventPartial", ["module:Handlers.Partial"], function (Partial, scoped) {
 	var Cls = Partial.extend({scoped: scoped}, function (inherited) {
 		return {
			
 			constructor: function (node, args, value, postfix) {
 				inherited.constructor.apply(this, arguments);
 				var self = this;
 				this.__postfix = postfix;
 				this._node._$element.on(postfix + "." + this.cid(), function () {
 					self._execute(value.trim());
 				});
 			},
 			
 			destroy: function () {
 				this._node._$element.off(this.__postfix + "." + this.cid());
 				inherited.destroy.call(this);
 			}
 		
 		};
 	});
 	Cls.register("ba-on");
	return Cls;
});
