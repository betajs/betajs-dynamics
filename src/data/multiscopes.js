Scoped.define("module:Data.AbstractMultiScope", [
    "base:Class",
    "base:Events.EventsMixin",
    "base:Events.ListenMixin",
    "base:Properties.ObservableMixin"
], function(Class, EventsMixin, ListenMixin, ObservableMixin, scoped) {
    return Class.extend({
        scoped: scoped
    }, [EventsMixin, ListenMixin, ObservableMixin, function(inherited) {
        return {

            constructor: function() {
                inherited.constructor.call(this);
                var iter = this.iterator();
                while (iter.hasNext())
                    this.delegateEvents(null, iter.next());
            },

            destroy: function() {
                var iter = this.iterator();
                while (iter.hasNext())
                    iter.next().off(null, null, this);
                inherited.destroy.call(this);
            },

            set: function(key, value) {
                var iter = this.iterator();
                while (iter.hasNext())
                    iter.next().set(key, value);
                return this;
            },

            get: function(key) {
                var iter = this.iterator();
                return iter.hasNext() ? iter.next().get(key) : null;
            },

            hasKey: function(key) {
                var iter = this.iterator();
                while (iter.hasNext())
                    if (iter.next().hasKey(key))
                        return true;
                return false;
            },

            setProp: function(key, value) {
                var iter = this.iterator();
                while (iter.hasNext())
                    iter.next().setProp(key, value);
                return this;
            },

            getProp: function(key) {
                var iter = this.iterator();
                return iter.hasNext() ? iter.next().getProp(key) : null;
            },

            define: function(name, func) {
                var iter = this.iterator();
                while (iter.hasNext())
                    iter.next().define(name, func);
                return this;
            },

            /* Deprecated */
            call: function(name) {
                return this.execute.apply(this, arguments);
            },

            execute: function(name) {
                var iter = this.iterator();
                var result = null;
                while (iter.hasNext()) {
                    var obj = iter.next();
                    var local = obj.execute.apply(obj, arguments);
                    result = result || local;
                }
                return result;
            },

            materialize: function(returnFirst) {
                return returnFirst ? this.iterator().next() : this.iterator().asArray();
            },

            iterator: function() {
                throw "Abstract";
            },

            _addScope: function(scope) {
                this.delegateEvents(null, scope);
                this.trigger("addscope", scope);
                return this;
            },

            _removeScope: function(scope) {
                scope.off(null, null, this);
                this.trigger("removescope", scope);
                return this;
            }

        };
    }]);
});



Scoped.define("module:Data.ManualMultiScope", [
    "module:Data.AbstractMultiScope"
], function(Class, scoped) {
    return Class.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(iteratorCallback, iteratorContext) {
                this.__iteratorCallback = iteratorCallback;
                this.__iteratorContext = iteratorContext;
                inherited.constructor.call(this);
            },

            iterator: function() {
                return this.__iteratorCallback.call(this.__iteratorContext);
            },

            addScope: function(scope) {
                return this._addScope(scope);
            },

            removeScope: function(scope) {
                return this._removeScope(scope);
            }

        };
    });
});


Scoped.define("module:Data.MultiScope", [
    "module:Data.AbstractMultiScope",
    "base:Iterators.ArrayIterator"
], function(Class, ArrayIterator, scoped) {
    return Class.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(owner, base, query) {
                this.__owner = owner;
                this.__base = base;
                this.__queryStr = query;
                this.__query = this.auto_destroy(this.__owner.__manager.query(this.__owner, query));
                inherited.constructor.call(this);
                this.__query.on("add", this._addScope, this);
                this.__query.on("remove", this._removeScope, this);
            },

            iterator: function() {
                return new ArrayIterator(this.__query.result());
            },

            parent: function() {
                return this.__owner.scope(this.__base, this.__queryStr + "<");
            },

            root: function() {
                return this.__owner.root();
            },

            children: function() {
                return this.__owner.scope(this.__base, this.__queryStr + ">");
            },

            scope: function(base, query) {
                if (arguments.length < 2) {
                    query = this.__queryStr + base;
                    base = this.__base;
                }
                return this.__owner.scope(base, query);
            },

            freeze: function() {
                this.__query.off("add", null, this);
            }

        };
    });
});