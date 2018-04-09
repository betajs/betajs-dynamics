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
                this.__initialRoot = options.root;
                this.__persistent_dynamics = !!options.persistent_dynamics;
                this.__allowed_dynamics = options.allowed_dynamics ? Objs.objectify(options.allowed_dynamics) : null;
                this.__forbidden_dynamics = options.forbidden_dynamics ? Objs.objectify(options.forbidden_dynamics) : null;
                this.__ignore_existing = options.ignore_existing;
                this.__dynamics = {};
                this.__enabled = false;
                if (!("enabled" in options) || options.enabled)
                    this.enable();
            },

            enable: function() {
                if (this.__enabled)
                    return;
                this.__enabled = true;
                this.__root = Dom.unbox(this.__initialRoot || document.body);
                if (!this.__ignore_existing)
                    Objs.iter(Registries.handler.classes(), this.__registerExisting, this);
                this.__observer = NodeInsertObserver.create({
                    root: this.__root,
                    filter: this.__observerFilter,
                    context: this
                });
                this.__observer.on("node-inserted", this.__nodeInserted, this);
            },

            disable: function() {
                if (!this.__enabled)
                    return;
                this.__enabled = false;
                this.__observer.weakDestroy();
            },

            __registerExisting: function(cls, key) {
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
            },

            addAllowedDynamic: function(key) {
                this.__allowed_dynamics = this.__allowed_dynamics || {};
                this.__allowed_dynamics[key] = true;
                var cls = (Registries.handler.classes())[key];
                if (this.__enabled && !this.__ignore_existing && cls)
                    this.__registerExisting(cls, key);
            },

            destroy: function() {
                this.disable();
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