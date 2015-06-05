Scoped.define("module:Handlers.ShowPartial", ["module:Handlers.Partial"], function (Partial, scoped) {
  /**
   * @name ba-show
   *
   * @description
   * The ba-show partials controls showing the internal Html on the Dom based on
   * the truth value of the given expression.
   *
   * @param {expression} baShow Expression to evaluate for truth. If true,
   * internal html will be displayed. If false, internal html will not be
   * displayed.
   *
   * @example <p ba-show="1 === 1">Hi</p>
   * // Evalues to <p>Hi</p>
   * @example <p ba-show="1 === 2">Hi</p>
   * // Evalues to <p style="display: none;">Hi</p>
   */
 	var Cls = Partial.extend({scoped: scoped}, function (inherited) {
 		return {
			
 			constructor: function (node, args, value) {
 				inherited.constructor.apply(this, arguments);
 				if (!value)
 					node._$element.hide();
 			},
 			
 			_apply: function (value) {
 				if (value)
 					this._node._$element.show();
 				else
 					this._node._$element.hide();
 			}
 		
 		};
 	});
 	Cls.register("ba-show");
	return Cls;
});
