Scoped.define("module:Handlers.ClassPartial", ["module:Handlers.Partial"], function (Partial, scoped) {
  /**
   * @name ba-class
   *
   * @description
   * Dynamically set the HTML class of the given element based on the evaluation
   * of expressions.
   *
   * @param {object} baClass Object where keys are Html classes and values are
   * expressions. If the expression evaluates to true, the class is included on
   * the Html element. If the expression evaluates to false, the class is not
   * included.
   *
   * @example <div ba-class="{{'first': true, 'second': 1 === 2}}></div>"
   * // Evaluates to <div class="first"></div>
   */
 	var Cls = Partial.extend({scoped: scoped}, {
		
		_apply: function (value) {
			for (var key in value) {
				if (value[key])
					this._node._$element.addClass(key);
				else
					this._node._$element.removeClass(key);
			}
		}

 	});
 	Cls.register("ba-class");
	return Cls;
});
