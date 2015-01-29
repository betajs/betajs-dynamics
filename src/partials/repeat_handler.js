BetaJS.Dynamics.HandlerPartial.extend("BetaJS.Dynamics.RepeatPartial", {
	
	constructor: function (node, args, value) {
		this._inherited(BetaJS.Dynamics.RepeatPartial, "constructor", node, args, value);
		node._expandChildren = false;
		node._$element.html("");
	},
	
	_activate: function () {		
		this.__register(this._value);
	},
	
	_deactivate: function () {
		this.__unregister();
	},
	
	_change: function (value, oldValue) {
		this.__register(value);
	},
	
	__register: function (value) {
		this.__unregister();
		if (!BetaJS.Collections.Collection.is_instance_of(value)) {
			BetaJS.Objs.iter(value, this.__appendItem, this);
		} else {
			this.__collection = value;
			this.__collection_map = {};
			this.__collection.iterate(function (item) {
				this.__collection_map[item.cid()] = this.__appendItem(item);
			}, this);
			this.__collection.on("add", function (item) {
				this.__collection_map[item.cid()] = this.__appendItem(item);
			}, this);
			this.__collection.on("remove", function (item) {
				BetaJS.Objs.iter(this.__collection_map[item.cid()], function (entry) {
					var ele = entry.$element();
					entry.destroy();
					ele.remove();
				}, this);
				delete this.__collection_map[item.cid()];
			}, this);
		}
	},
	
	__unregister: function () {
		var $element = this._node._$element;
		this._node._removeChildren();
		$element.html("");
		if (this.__collection) {
			this.__collection.off(null, null, this);
			this.__collection = null;
			this.__collection_map = null;
		}
	},
	
	__appendItem: function (value) {
		var elements = BetaJS.$(this._node._innerTemplate.trim()).appendTo(this._node._$element);			
		var locals = {};
		if (this._args)
			locals[this._args] = value;	
		var result = [];
		var self = this;
		elements.each(function () {
			result.push(self._node._registerChild(this, locals));
		});
		return result;
	}
	
});

BetaJS.Dynamics.RepeatPartial.register("ba-repeat");