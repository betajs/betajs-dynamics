Scoped.define("module:Partials.RepeatPartial", [
    "module:Handlers.Partial",
    "base:Promise",
    "base:Properties.Properties",
    "base:Collections.Collection",
    "base:Collections.FilteredCollection",
    "base:Objs",
    "module:Parser",
    "module:Registries"
], function(Partial, Promise, Properties, Collection, FilteredCollection, Objs, Parser, Registries, scoped) {
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

    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(node, args, value) {
                inherited.constructor.apply(this, arguments);
                this.__alwaysReindexNewItems = false;
                this.__registered = false;
                args = args.split("::");
                if (args.length > 1)
                    this.__dynOpts = Parser.parseCode(args[0].trim());
                args = args[args.length - 1];
                args = args.split("~");
                this.__repeatArg = args[0].trim();
                this._destroyCollection = false;
                this._releaseValueCollection = false;
                if (args.length > 1) {
                    this.__repeatFilter = Parser.parseCode(args[1].trim());
                    var self = this;
                    node.mesh().watch(this.__repeatFilter.dependencies, function() {
                        self.__filterChanged();
                    }, this.__repeatFilter);
                }
                node._expandChildren = false;
                try {
                    node._element.innerHTML = "";
                } catch (e) {}
            },

            destroy: function() {
                this.__unregister();
                if (this.__repeatFilter)
                    this._node.mesh().unwatch(this.__repeatFilter.dependencies, this.__repeatFilter);
                inherited.destroy.call(this);
            },

            _activate: function() {
                this.__register();
                if (this.__dynOpts)
                    this.__dynOptsCache = this._node.mesh().execute(this.__dynOpts.dependencies, this.__dynOpts.func);
            },

            _deactivate: function() {
                this.__unregister();
            },

            __filterChanged: function() {
                if (!this._active)
                    return;
                this._collection.setFilter(this.__filterFunc, this);
            },

            _change: function(value, oldValue) {
                this.__register(value);
            },

            __filterFunc: function(prop) {
                var filter = this.__repeatFilter;
                if (!filter)
                    return true;
                var self = this;
                return this._node.mesh().execute(filter.dependencies, function(obj) {
                    obj[self.__repeatArg] = self._isArray ? prop.get("value") : prop.data();
                    return filter.func.call(this, obj);
                }, true);
            },

            _iterateCollection: function(callback) {
                this._collection.iterate(callback, this);
            },

            __register: function() {
                this.__unregister();
                if (Collection.is_instance_of(this._value) && this._value.destroyed())
                    return;
                this._isArray = !Collection.is_instance_of(this._value);
                this._releaseValueCollection = !Collection.is_instance_of(this._value);
                this._valueCollection = this._releaseValueCollection ? new Collection({
                    objects: Objs.map(this._value, function(val) {
                        return new Properties({
                            value: val
                        });
                    }),
                    release_references: true
                }) : this._value;
                this._destroyCollection = !!this.__repeatFilter;
                this._collection = this._destroyCollection ? new FilteredCollection(this._valueCollection, {
                    filter: this.__filterFunc,
                    context: this
                }) : this._valueCollection;
                this._collectionChildren = {};
                this._iterateCollection(this.__addItem);
                this._collection.on("add", this.__addItem, this);
                this._collection.on("remove", function(item) {
                    this.__removeItem(item, this._collection.bulkOperationInProgress());
                }, this);
                this._collection.on("reindexed", function(item) {
                    if (this._collection.count() < 2)
                        return;
                    var idx = this._collection.getIndex(item);
                    if (idx === 0)
                        this._prependItem(this._collection.getByIndex(1), item);
                    else
                        this._appendItem(this._collection.getByIndex(idx - 1), item);
                }, this);
            },

            __unregister: function() {
                if (this._collection && !this._collection.destroyed()) {
                    this._iterateCollection(function(item) {
                        this.__removeItem(item, true);
                    }, this);
                }
                var element = this._node._element;
                this._node._removeChildren();
                element.innerHTML = "";
                if (this._collection && !this._collection.destroyed())
                    this._collection.off(null, null, this);
                if (this._valueCollection && !this._valueCollection.destroyed())
                    this._valueCollection.off(null, null, this);
                if (this._destroyCollection && this._collection)
                    this._collection.weakDestroy();
                if (this._releaseValueCollection && this._valueCollection && !this._valueCollection.destroyed())
                    this._valueCollection.decreaseRef();
                this._valueCollection = null;
                this._collection = null;
            },

            __addItem: function(item) {
                if (this._collectionChildren[item.cid()])
                    return;
                var locals = {};
                if (this.__repeatArg)
                    locals[this.__repeatArg] = this._isArray ? item.get("value") : item;
                var result = [];
                var elements = this._newItemElements();
                elements.forEach(function(element) {
                    result.push(this._node._registerChild(element, locals));
                }, this);
                this._collectionChildren[item.cid()] = {
                    item: item,
                    nodes: result
                };
                var idx = this._collection.getIndex(item);
                if (idx < this._collection.count() - 1)
                    this._prependItem(this._collection.getByIndex(idx + 1), item);
                else if (this.__alwaysReindexNewItems && this._collection.count() > 1)
                    this._appendItem(this._collection.getByIndex(idx - 1), item);
            },

            __removeItem: function(item, instant) {
                if (!this._collectionChildren[item.cid()])
                    return;
                Objs.iter(this._collectionChildren[item.cid()].nodes, function(node) {
                    var ele = node.element();
                    var removePromise = Promise.create();
                    if (this.__dynOptsCache && this.__dynOptsCache.onremove && !instant)
                        this.__dynOptsCache.onremove.call(this._handler, item, ele).forwardCallback(removePromise);
                    else
                        removePromise.asyncSuccess(true);
                    removePromise.success(function() {
                        node.weakDestroy();
                        if (ele.parentNode)
                            ele.parentNode.removeChild(ele);
                    });
                }, this);
                delete this._collectionChildren[item.cid()];
            },

            _itemData: function(item) {
                return this._collectionChildren[item.cid()];
            },

            _itemDataElements: function(item) {
                var itemData = this._itemData(item);
                if (!itemData)
                    return null;
                var result = [];
                Objs.iter(itemData.nodes, function(node) {
                    result.push(node.element());
                });
                return result;
            },

            _prependItem: function(base, item) {
                var baseDataElements = this._itemDataElements(base);
                var itemDataElements = this._itemDataElements(item);
                if (!baseDataElements || !itemDataElements)
                    return;
                Objs.iter(itemDataElements, function(element) {
                    element.parentNode.insertBefore(element, baseDataElements[0]);
                });
            },

            _appendItem: function(base, item) {
                var baseDataElements = this._itemDataElements(base);
                var itemDataElements = this._itemDataElements(item);
                if (!baseDataElements || !itemDataElements)
                    return;
                var current = baseDataElements[baseDataElements.length - 1];
                Objs.iter(itemDataElements, function(element) {
                    current.parentNode.insertBefore(element, current.nextSibling);
                    current = element;
                });
            },

            _newItemElements: function() {
                var elements = Registries.templates.create(this._node._innerTemplate);
                var parent = this._node.element();
                elements.forEach(function(element) {
                    parent.appendChild(element);
                });
                return elements;
            }

        };
    });
    Cls.register("ba-repeat");
    return Cls;
});