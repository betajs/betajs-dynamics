
Scoped.define("module:Partials.TapPartial", [
	"module:Handlers.Partial",
	"browser:Info",
	"browser:Events"
], function (Partial, Info, Events, scoped) {
  /**
   * @name ba-tap
   *
   * @description
   * The ba-tap partial allows the specification of custom on tap behavior. Tap
   * is particularly useful for handling mobile events.
   *
   * @param {expression} baTap Expression to evaluate upon tap. See ba-click
   * documentation for more details as they are very similar.
   *
   * @example <button ba-tap="someMethod()">Tap</button>
   * // Calls parentDirective.call("someMethod") on tap.
   */
 	var Cls = Partial.extend({scoped: scoped}, function (inherited) {
 		return {
			
 			constructor: function (node, args, value) {
 				inherited.constructor.apply(this, arguments);
 				var events = this.auto_destroy(new Events());
 				events.on(this._node._element, Info.isMobile() ? "touchstart" : "click", function (e) {
 					e.stopPropagation();
 					this._execute();
 				}, this);
 			}
 		
 		};
 	});
 	Cls.register("ba-tap");
	return Cls;
});
