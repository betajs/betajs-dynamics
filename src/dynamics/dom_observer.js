Scoped.define("module:DomObserver", [
    "base:Class",
    "base:Objs",
    "browser:DomMutation.NodeInsertObserver",
    "module:Registries",
    "module:Dynamic",
    "browser:Dom"
], function(Class, Objs, NodeInsertObserver, Registries, Dynamic, Dom, scoped) {
    return Class.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(options) {
                inherited.constructor.call(this);
                options = options || {};
                this.__root = Dom.unbox(options.root || document.body);
                this.__persistent_dynamics = !!options.persistent_dynamics;
                this.__allowed_dynamics = options.allowed_dynamics ? Objs.objectify(options.allowed_dynamics) : null;
                this.__forbidden_dynamics = options.forbidden_dynamics ? Objs.objectify(options.forbidden_dynamics) : null;
                this.__dynamics = {};
                if (!options.ignore_existing) {
                    Objs.iter(Registries.handler.classes(), function(cls, key) {
                        if (this.__forbidden_dynamics && this.__forbidden_dynamics[key])
                            return;
                        if (this.__allowed_dynamics && !this.__allowed_dynamics[key])
                            return;
                        var tags = this.__root.getElementsByTagName(key.toUpperCase());
                        for (var i = 0; i < tags.length; ++i) {
                            var elem = tags[i];
                            if (!elem.dynamicshandler)
                                this.__nodeInserted(elem);
                        }
                    }, this);
                }
                this.__observer = NodeInsertObserver.create({
                    root: this.__root,
                    filter: this.__observerFilter,
                    context: this
                });
                this.__observer.on("node-inserted", this.__nodeInserted, this);
            },

            destroy: function() {
                this.__observer.destroy();
                Objs.iter(this.__dynamics, function(dynamic) {
                    dynamic.off(null, null, this);
                    if (!this.__persistent_dynamics)
                        dynamic.weakDestroy();
                }, this);
                inherited.destroy.call(this);
            },

            __observerFilter: function(node) {
                if (node.dynamicshandler || !node.tagName)
                    return false;
                var tag = node.tagName.toLowerCase();
                if (!Registries.handler.get(tag))
                    return false;
                if (this.__forbidden_dynamics && this.__forbidden_dynamics[tag])
                    return false;
                if (this.__allowed_dynamics && !this.__allowed_dynamics[tag])
                    return false;
                return true;
            },

            __nodeInserted: function(node) {
                var dynamic = new Dynamic({
                    element: node,
                    remove_observe: true
                });
                this.__dynamics[dynamic.cid()] = dynamic;
                dynamic.on("destroy", function() {
                    delete this.__dynamics[dynamic.cid()];
                }, this);
                dynamic.activate();
            }

        };
    }, {

        __singleton: null,

        activate: function(options) {
            if (!this.__singleton)
                this.__singleton = new this(options);
        }

    });
});