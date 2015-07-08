Scoped.define("module:Partials.AttrsPartial", ["module:Handlers.Partial"], function (Partial, scoped) {
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
			var props = this._node._tagHandler ? this._node._tagHandler.properties() : this._node.properties();
			for (var key in value)
				props.set(key, value[key]);
		},
		
		bindTagHandler: function (handler) {
			this._apply(this._value);
		}

 	});
 	Cls.register("ba-attrs");
	return Cls;
});
