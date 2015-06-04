Scoped.define("module:Handlers.RepeatElementPartial", [
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
 				this.__filteredTemplate = $(node._template).removeAttr("ba-repeat-element").get(0).outerHTML;
 				node._expandChildren = false;
 				node._$element.html("");
 			},
 			
 			destroy: function () {
 				this.__unregister();
 				if (this.__filteredCollection)
 					this.__filteredCollection.destroy();
 				if (this.__repeatFilter)
 					node.mesh().unwatch(this.__repeatFilter.dependencies, this.__repeatFilter);
 				inherited.destroy.call(this);
 			},
 		
 			_activate: function () {
 				this._node._$element.hide();
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
				}, true);
 			},
 			
 			__register: function (value) {
 				this.__unregister();
 				if (!Collection.is_instance_of(value)) {
 					for (var i = value.length - 1; i >= 0; i--) {
 						var prop = value[i];
 						if (this.__filterFunc(prop))
 							this.__appendItem(prop);
 					}
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
 					var itemArr = this.__collection.iterator().asArray();
 					for (var j = itemArr.length - 1; j >= 0; j--) {
 						var item = itemArr[j];
 						this.__collection_map[item.cid()] = this.__appendItem(item);
 					}
 					this.__collection.on("add", function (item) {
 						this.__collection_map[item.cid()] = this.__appendItem(item);
 					}, this);
 					this.__collection.on("remove", function (item) {
 						var entry = this.__collection_map[item.cid()];
 						if (!entry.destroyed()) {
							var ele = entry.$element();
							entry.destroy();
							ele.remove();
 						}
 						delete this.__collection_map[item.cid()];
 					}, this);
 				}
 				this.__registered = true;
 			},
 			
 			__unregister: function () {
 				this.__registered = false;
 				Objs.iter(this.__collection_map, function (entry) {
					var ele = entry.$element();
					entry.destroy();
					ele.remove();
				}, this);
 				if (this.__collection) {
 					this.__collection.off(null, null, this);
 					this.__collection = null;
 					this.__collection_map = null;
 				}
				if (this.__filteredCollection)
					this.__filteredCollection.destroy();
 			},
 			
 			__appendItem: function (value) {
 				var template = this.__filteredTemplate.trim();
				var element = $(template).get(0);
				this._node._$element.after(element);
 				var locals = {};
 				if (this.__repeatArg)
 					locals[this.__repeatArg] = value;
 				element["ba-handled"] = true;
 				var result = this._node._registerChild(element, locals);
 				return result;
 			}

 		};
 	});
 	Cls.register("ba-repeat-element");
	return Cls;
});
