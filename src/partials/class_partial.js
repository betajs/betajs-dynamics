Scoped.define("module:Partials.ClassPartial", ["module:Handlers.Partial"], function (Partial, scoped) {
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
   * @example <div ba-class="{{{'first': true, 'second': 1 === 2}}}></div>"
   * // Evaluates to <div class="first"></div>
   */
 	var Cls = Partial.extend({scoped: scoped}, {
		
		_apply: function (value) {
			for (var key in value) {
				var className = this._node.element().className;
				var hasClass = className.indexOf(key) >= 0;
				if (value[key] !== hasClass) {
					if (value[key])
						className += " " + key;
					else
						className = className.replace(key, "").replace("  ", " ");
					this._node.element().className = className.trim();
				}
			}
		}

 	});
 	Cls.register("ba-class");
	return Cls;
});
