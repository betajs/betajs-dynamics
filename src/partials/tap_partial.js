
Scoped.define("module:Partials.TapPartial", ["module:Handlers.Partial", "browser:Info"], function (Partial, Info, scoped) {
  /**
   * @name ba-tap
   *
   * @description
   * The ba-tao partial allows the specification of custom on tap behavior. Tap
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
