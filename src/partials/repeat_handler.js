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
				var ele = this.__collection_map[item.cid()].$element();
				this.__collection_map[item.cid()].destroy();
				delete this.__collection_map[item.cid()];
				ele.remove();
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
		this._node._$element.append(this._node._innerTemplate);			
		var element = this._node._$element.find(">:last").get(0);
		var locals = {};
		if (this._args)
			locals[this._args] = value;		
		return this._node._registerChild(element, locals);
	}
	
});

BetaJS.Dynamics.RepeatPartial.register("ba-repeat");