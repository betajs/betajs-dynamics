Scoped.define("module:Partials.RepeatPartial", [
        "module:Handlers.Partial",
        "base:Properties.Properties",
        "base:Collections.Collection",
        "base:Collections.FilteredCollection",
        "base:Objs",
        "jquery:",
        "module:Parser",
        "base:Strings",
        "module:Registries"
	], function (Partial, Properties, Collection, FilteredCollection, Objs, $, Parser, Strings, Registries, scoped) {
	  /**
	   * @name ba-repeat
	   *
	   * @description
	   * Instantiate once for each instance in the collection. Render only the inner html
	   * of the element for each instance.
	   *
	   * @param {object} instance Object representing a single element in the
	   * collection. Updated as collection is iterated through.
	   *
	   * @param {object} collection Object representing multiple elements, each of
	   * which will be instantiated.
	   *
	   * @example <ul ba-repeat-element="{{ i :: [1,2] }}"><li>{{i}}</li></ul>
	   * // Evaluates to <ul><li>1</li><li>2</li></ul>
	   */

	var Cls = Partial.extend({scoped: scoped}, function (inherited) {
 		return {
			
 			constructor: function (node, args, value) {
 				inherited.constructor.apply(this, arguments);
 				this.__registered = false;
 				args = args.split("~");
 				this.__repeatArg = Strings.trim(args[0]);
 				this._destroyCollection = false;
 				this._destroyValueCollection = false;
 				if (args.length > 1) {
 					this.__repeatFilter = Parser.parseCode(Strings.trim(args[1]));
 					var self = this;
 					node.mesh().watch(this.__repeatFilter.dependencies, function () {
 						self.__filterChanged();
 					}, this.__repeatFilter);
 				}
 				node._expandChildren = false;
 				node._$element.html("");
 			},

 			destroy: function () {
 				this.__unregister();
 				if (this.__repeatFilter)
 					node.mesh().unwatch(this.__repeatFilter.dependencies, this.__repeatFilter);
 				inherited.destroy.call(this);
 			},
 			
 			_activate: function () {		
 				this.__register();
 			},
 			
 			_deactivate: function () {
 				this.__unregister();
 			},
 			
 			__filterChanged: function () {
 				if (!this._active)
 					return;
				this._collection.setFilter(this.__filterFunc, this);
 			},
 			
 			_change: function (value, oldValue) {
 				this.__register(value);
 			},
 			
 			__filterFunc: function (prop) {
				var filter = this.__repeatFilter;
				if (!filter)
					return true;
				var self = this;
 				return this._node.mesh().call(filter.dependencies, function (obj) {
 					obj[self.__repeatArg] = self._isArray ? prop.get("value") : prop.data();
					return filter.func.call(this, obj);
				}, true);
 			},
 			
 			__register: function () {
 				this.__unregister();
 				this._isArray = !Collection.is_instance_of(this._value);
 				this._destroyValueCollection = !Collection.is_instance_of(this._value);
 				this._valueCollection = this._destroyValueCollection ? new Collection({
 					objects: Objs.map(this._value, function (val) {
 						return new Properties({value: val});
 					})}) : this._value;
 				this._destroyCollection = !!this.__repeatFilter;
				this._collection = this._destroyCollection ? new FilteredCollection(this._valueCollection, {
					filter: this.__filterFunc,
					context: this
				}) : this._valueCollection;
				this._collectionChildren = {};
				this._collection.iterate(this.__addItem, this);
				this._collection.on("add", this.__addItem, this);
				this._collection.on("remove", this.__removeItem, this);
				this._collection.on("reindexed", function (item) {
					if (this._collection.count() < 2)
						return;
					var idx = this._collection.getIndex(item);
					if (idx === 0)
						this._prependItem(this._collection.getByIndex(1), item);
					else
						this._appendItem(this._collection.getByIndex(idx - 1), item);
				}, this);
 			},
 			
 			__unregister: function () {
 				if (!this._collection)
 					return;
 				this._collection.iterate(this.__removeItem, this);
 				var $element = this._node._$element;
 				this._node._removeChildren();
 				$element.html("");
 				this._collection.off(null, null, this);
 				this._valueCollection.off(null, null, this);
 				if (this._destroyCollection)
 					this._collection.destroy();
 				if (this._destroyValueCollection)
 					this._valueCollection.destroy();
 				this._valueCollection = null;
 				this._collection = null;
 			},
 			
 			__addItem: function (item) {
 				if (this._collectionChildren[item.cid()])
 					return;
 				var locals = {};
 				if (this.__repeatArg)
 					locals[this.__repeatArg] = this._isArray ? item.get("value") : item;
 				var result = [];
 				var self = this;
 				var elements = this._newItemElements();
 				elements.each(function () {
 					result.push(self._node._registerChild(this, locals));
 				});
 				this._collectionChildren[item.cid()] = {
					item: item,
					nodes: result
				};
 				var idx = this._collection.getIndex(item);
 				if (idx < this._collection.count() - 1)
 					this._prependItem(this._collection.getByIndex(idx + 1), item);
 			},
 			
 			__removeItem: function (item) {
 				if (!this._collectionChildren[item.cid()])
 					return;
				Objs.iter(this._collectionChildren[item.cid()].nodes, function (node) {
					var ele = node.$element();
					node.destroy();
					ele.remove();
				}, this);
				delete this._collectionChildren[item.cid()];
 			},
 			
 			_itemData: function (item) {
 				return this._collectionChildren[item.cid()];
 			},
 			
 			_itemDataElements: function (item) {
 				var itemData = this._itemData(item);
 				if (!itemData)
 					return null;
 				var result = [];
 				Objs.iter(itemData.nodes, function (node) {
 					result.push(node.$element());
 				});
 				return result;
 			},
 			
 			_prependItem: function (base, item) {
 				var baseDataElements = this._itemDataElements(base);
 				var itemDataElements = this._itemDataElements(item);
 				if (!baseDataElements || !itemDataElements)
 					return;
 				Objs.iter(itemDataElements, function (element) {
 					element.insertBefore(baseDataElements[0]);
 				});
 			},
 			
 			_appendItem: function (base, item) {
 				var baseDataElements = this._itemDataElements(base);
 				var itemDataElements = this._itemDataElements(item);
 				if (!baseDataElements || !itemDataElements)
 					return;
 				var current = baseDataElements[baseDataElements.length - 1];
 				Objs.iter(itemDataElements, function (element) {
 					current.after(element);
 					current = element;
 				});
 			},
 			
 			_newItemElements: function () {
 				return Registries.templates.create(this._node._innerTemplate).appendTo(this._node._$element);
 			}
 			
 		};
 	});
 	Cls.register("ba-repeat");
	return Cls;
});
