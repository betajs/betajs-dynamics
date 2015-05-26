Scoped.define("module:Handlers.RepeatPartial", [
        "module:Handlers.Partial",
        "base:Collections.Collection",
        "base:Collections.FilteredCollection",
        "base:Objs",
        "jquery:",
        "module:Parser",
        "base:Properties.Properties"
	], function (Partial, Collection, FilteredCollection, Objs, $, Parser, Properties, scoped) {
 	var Cls = Partial.extend({scoped: scoped}, function (inherited) {
 		return {
			
 			constructor: function (node, args, value) {
 				inherited.constructor.apply(this, arguments);
 				this.__registered = false;
 				args = args.split("~");
 				this.__repeatArg = args[0].trim();
 				if (args.length > 1) {
 					this.__repeatFilter = Parser.parseCode(args[1].trim());
 					var self = this;
 					node.mesh().watch(this.__repeatFilter.dependencies, function () {
 						if (self._active && self.__registered) {
 							if (self.__filteredCollection)
 								self.__filteredCollection.setFilter(self.__filterFunc, self);
 							else
 								self.__register(self._value);
 						}
 					}, this.__repeatFilter);
 				}
 				node._expandChildren = false;
 				node._$element.html("");
 			},
 			
 			destroy: function () {
 				if (this.__filteredCollection)
 					this.__filteredCollection.destroy();
 				if (this.__repeatFilter)
 					node.mesh().unwatch(this.__repeatFilter.dependencies, this.__repeatFilter);
 				inherited.destroy.call(this);
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
 			
 			__filterFunc: function (prop) {
				var filter = this.__repeatFilter;
				if (!filter)
					return true;
 				return this._node.mesh().call(filter.dependencies, function (obj) {
					return filter.func.call(this, Objs.extend(obj, Properties.is_instance_of(prop) ? prop.data() : prop));
				});
 			},
 			
 			__register: function (value) {
 				this.__unregister();
 				if (!Collection.is_instance_of(value)) {
 					Objs.iter(value, function (prop) {
 						if (this.__filterFunc(prop))
 							this.__appendItem(prop);
 					}, this);
 				} else {
 					this.__collection = value;
 					if (this.__repeatFilter) {
 						this.__filteredCollection = new FilteredCollection(this.__collection, {
 							filter: this.__filterFunc,
 							context: this
 						});
 						this.__collection = this.__filteredCollection;
 					}
 					this.__collection_map = {};
 					this.__collection.iterate(function (item) {
 						this.__collection_map[item.cid()] = this.__appendItem(item);
 					}, this);
 					this.__collection.on("add", function (item) {
 						this.__collection_map[item.cid()] = this.__appendItem(item);
 					}, this);
 					this.__collection.on("remove", function (item) {
 						Objs.iter(this.__collection_map[item.cid()], function (entry) {
 							var ele = entry.$element();
 							entry.destroy();
 							ele.remove();
 						}, this);
 						delete this.__collection_map[item.cid()];
 					}, this);
 				}
 				this.__registered = true;
 			},
 			
 			__unregister: function () {
 				this.__registered = false;
 				var $element = this._node._$element;
 				this._node._removeChildren();
 				$element.html("");
 				if (this.__collection) {
 					this.__collection.off(null, null, this);
 					this.__collection = null;
 					this.__collection_map = null;
 				}
				if (this.__filteredCollection)
					this.__filteredCollection.destroy();
 			},
 			
 			__appendItem: function (value) {
 				var elements;
 				var template = this._node._innerTemplate.trim();
 				try {
 					elements = $(template).appendTo(this._node._$element);
 				} catch (e) {
 					elements = $(document.createTextNode(template)).appendTo(this._node._$element);
 				}
 				var locals = {};
 				if (this.__repeatArg)
 					locals[this.__repeatArg] = value;	
 				var result = [];
 				var self = this;
 				elements.each(function () {
 					result.push(self._node._registerChild(this, locals));
 				});
 				return result;
 			}
 		
 		};
 	});
 	Cls.register("ba-repeat");
	return Cls;
});
