Scoped.define("module:Partials.RadioGroupPartial", [
	"module:Handlers.Partial",
	"browser:Events"
], function (Partial, Events, scoped) {
 	var Cls = Partial.extend({scoped: scoped}, function (inherited) {
 		return {
			
 			constructor: function (node, args, value) {
 				inherited.constructor.apply(this, arguments);
 				var events = this.auto_destroy(new Events());
 				value = value.trim();
 				this._node._$element.prop("checked", this._node._$element.val() === this._node.properties().get(value));
 				events.on(this._node.element(), "change", function () {
 					this._node.properties().set(value, this._node._$element.val());
 				}, this);
 				this._node.properties().on("change:" + value, function () {
 					this._node._$element.prop("checked", this._node._$element.val() === this._node.properties().get(value)); 					
 				}, this);
 			}
 		
 		};
 	});
 	Cls.register("ba-radio-group");
	return Cls;
});
