Scoped.define("module:Partials.RadioGroupPartial", ["module:Handlers.Partial"], function (Partial, scoped) {
 	var Cls = Partial.extend({scoped: scoped}, function (inherited) {
 		return {
			
 			constructor: function (node, args, value) {
 				inherited.constructor.apply(this, arguments);
 				var self = this;
 				value = value.trim();
 				this._node._$element.prop("checked", self._node._$element.val() === this._node.properties().get(value));
 				this._node._$element.on("change." + this.cid(), function () {
 					self._node.properties().set(value, self._node._$element.val());
 				});
 				self._node.properties().on("change:" + value, function () {
 					this._node._$element.prop("checked", self._node._$element.val() === this._node.properties().get(value)); 					
 				}, this);
 			},
 			
 			destroy: function () {
 				this._node._$element.off("change." + this.cid());
 				inherited.destroy.call(this);
 			}
 		
 		};
 	});
 	Cls.register("ba-radio-group");
	return Cls;
});
