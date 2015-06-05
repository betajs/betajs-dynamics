Scoped.define("module:Handlers.AttrsPartial", ["module:Handlers.Partial"], function (Partial, scoped) {
  /**
   * @name ba-attrs
   *
   * @description
   * The ba-attrs partial allows the specification of an object that will
   * provide attributes accessible within the element containing the ba-attrs
   * html attribute.
   *
   * @param {object} baAttrs Object containing individual attributes.
   *
   * @example <div ba-attrs="{{{test: 'hi'}}}">{{test}}</div>
   * // Evaluates to <div ba-attrs="{{{test: 'hi'}}}">hi</div>
   */
 	var Cls = Partial.extend({scoped: scoped}, {
		
		_apply: function (value) {
			for (var key in value)
				this._node.properties().set(key, value[key]);
		}

 	});
 	Cls.register("ba-attrs");
	return Cls;
});
