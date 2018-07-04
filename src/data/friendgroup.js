Scoped.define("module:Data.Friendgroup", [
    "base:Class",
    "base:Types",
    "base:Objs",
    "base:Iterators.ObjectValuesIterator",
    "module:Data.ManualMultiScope"
], function(Class, Types, Objs, ObjectValuesIterator, ManualMultiScope, scoped) {
    return Class.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(parent) {
                inherited.constructor.call(this);
                this.parent = parent;
                this._registeredScopes = {};
                this._watchScopes = {};
            },

            destroy: function() {
                Objs.iter(this._watchScopes, function(m) {
                    m.weakDestroy();
                });
                inherited.destroy.call(this);
            },

            registerScope: function(scope, identifier) {
                this._registeredScopes[identifier] = this._registeredScopes[identifier] || {};
                this._registeredScopes[identifier][scope.cid()] = scope;
            },

            unregisterScope: function(scope, identifier) {
                delete this._registeredScopes[identifier][scope.cid()];
                if (Types.is_empty(this._registeredScopes[identifier]))
                    delete this._registeredScopes[identifier];
            },

            watchScope: function(reference, identifier) {
                if (!this._watchScopes[identifier]) {
                    this._watchScopes[identifier] = new ManualMultiScope(function() {
                        return this.iterateScopes(identifier);
                    }, this);
                }
                this._watchScopes[identifier].increaseRef(reference);
                return this._watchScopes[identifier];
            },

            unwatchScope: function(reference, identifier) {
                if (this._watchScopes[identifier]) {
                    this._watchScopes[identifier].decreaseRef(reference);
                    if (this._watchScopes[identifier].destroyed())
                        delete this._watchScopes[identifier];
                }
                return this;
            },

            iterateScopes: function(identifier) {
                return this._registeredScopes[identifier] || !this.parent ?
                    new ObjectValuesIterator(this._registeredScopes[identifier] || {}) :
                    this.parent.iterateScopes(identifier);
            }

        };
    });
});