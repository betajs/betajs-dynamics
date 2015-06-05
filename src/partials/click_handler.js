Scoped.define("module:Handlers.ClickPartial", ["module:Handlers.Partial"], function (Partial, scoped) {
  /**
   * @name ba-click
   *
   * @description
   * The ba-click partial allows the specification of custom on clicked
   * behavior.
   *
   * @param {expression} baClick Expression to evaluate upon click. If click is
   * within the scope of another directive, the Expression can be an exposed method of
   * the parent directive.
   *
   * @example <button ba-click="showing = !showing">
   * // Expression is evaluated (ex. showing now equals inverse) on click.
   *
   * @example <button ba-click="exposedMethod()">
   * // Calls parentDirective.call("exposedMethod") on click.
   *
   * @example <button ba-click="exposedMethod(arg)">
   * // Calls parentDirective.call("exposedMethod", arg) on click.
   */
 	var Cls = Partial.extend({scoped: scoped}, function (inherited) {
 		return {
			
 			constructor: function (node, args, value) {
 				inherited.constructor.apply(this, arguments);
 				var self = this;
 				this._node._$element.on("click", function () {
 					self._execute();
 				});
 			}
 		
 		};
 	});
 	Cls.register("ba-click");
	return Cls;
});
