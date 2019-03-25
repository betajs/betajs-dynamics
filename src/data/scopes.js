Scoped.define("module:Data.ScopeManager", [
    "base:Class",
    "base:Trees.TreeNavigator",
    "base:Classes.ObjectIdScopeMixin",
    "base:Trees.TreeQueryEngine"
], function(Class, TreeNavigator, ObjectIdScopeMixin, TreeQueryEngine, scoped) {
    return Class.extend({
        scoped: scoped
    }, [TreeNavigator, ObjectIdScopeMixin, function(inherited) {
        return {

            constructor: function(root) {
                inherited.constructor.call(this);
                this.__root = root;
                this.__watchers = [];
                this.__query = this._auto_destroy(new TreeQueryEngine(this));
            },

            nodeRoot: function() {
                return this.__root;
            },

            nodeId: function(node) {
                return node.cid();
            },

            nodeParent: function(node) {
                return node.__parent;
            },

            nodeChildren: function(node) {
                return node.__children;
            },

            nodeData: function(node) {
                return node.data();
            },

            nodeWatch: function(node, func, context) {
                node.on("data", function() {
                    func.call(context, "data");
                }, context);
                node.on("add", function(child) {
                    func.call(context, "addChild", child);
                }, context);
                node.on("destroy", function() {
                    func.call(context, "remove");
                }, context);
            },

            nodeUnwatch: function(node, func, context) {
                node.off(null, null, context);
            },

            query: function(scope, query) {
                return this.__query.query(scope, query);
            }

        };
    }]);
});

Scoped.define("module:Data.Scope", [
    "base:Class",
    "base:Events.EventsMixin",
    "base:Events.ListenMixin",
    "base:Classes.ObjectIdMixin",
    "base:Functions",
    "base:Types",
    "base:Strings",
    "base:Objs",
    "base:Ids",
    "base:Properties.Properties",
    "base:Collections.Collection",
    "base:Events.Events",
    "base:Properties.ObservableMixin",
    "module:Data.ScopeManager",
    "module:Data.MultiScope",
    "module:Data.AbstractMultiScope",
    "module:Data.Friendgroup"
], function(Class, EventsMixin, ListenMixin, ObjectIdMixin, Functions, Types, Strings, Objs, Ids, Properties, Collection, Events, ObservableMixin, ScopeManager, MultiScope, AbstractMultiScope, Friendgroup, scoped) {
    return Class.extend({
        scoped: scoped
    }, [EventsMixin, ListenMixin, ObjectIdMixin, ObservableMixin, function(inherited) {
        return {

            constructor: function(options) {
                options = Objs.extend({
                    functions: {},
                    data: {},
                    parent: null,
                    scopes: {},
                    bind: {},
                    attrs: {},
                    extendables: [],
                    collections: {},
                    computed: {},
                    events: {},
                    channels: {},
                    registerchannels: [],
                    friends: {}
                }, options);
                if (options.bindings)
                    options.bind = Objs.extend(options.bind, options.bindings);
                this._channels = {};
                this.__channelCache = {};
                var parent = options.parent;
                this.__manager = parent ? parent.__manager : this._auto_destroy(new ScopeManager(this));
                inherited.constructor.call(this);
                this.__parent = parent;
                this.__root = parent ? parent.root() : this;
                this.__children = {};
                this.__extendables = Objs.objectify(options.extendables);
                this.__properties = options.properties || new Properties();
                this.__properties.increaseRef(this);
                this.__properties.on("change", function(key, value, oldValue) {
                    this.trigger("change:" + key, value, oldValue);
                }, this);
                this.__functions = Objs.map(options.functions, function(value) {
                    return Types.is_string(value) ? Functions.as_method(this[value], this) : value;
                }, this);
                this.__scopes = {};
                this.__data = options.data;
                Objs.iter(Types.is_function(options.attrs) ? options.attrs.call(this) : options.attrs, function(value, key) {
                    if (!this.__properties.has(key))
                        this.set(key, value);
                }, this);
                this.setAll();
                Objs.iter(Types.is_function(options.collections) ? options.collections.call(this) : options.collections, function(value, key) {
                    if (Types.is_array(options.collections)) {
                        key = value;
                        value = [];
                    }
                    if (!this.__properties.has(key) || (Class.is_instance_of(this.__properties.get(key)) && this.__properties.get(key).destroyed())) {
                        this.set(key, this.auto_destroy(new Collection({
                            objects: value,
                            release_references: true
                        })));
                    }
                }, this);
                if (parent)
                    parent.__add(this);
                this.scopes = Objs.map(options.scopes, function(key) {
                    return this.scope(key);
                }, this);
                Objs.iter(options.bind, function(value, key) {
                    var i = value.indexOf(":");
                    this.bind(this.scope(value.substring(0, i)), key, {
                        secondKey: value.substring(i + 1)
                    });
                }, this);
                Objs.iter(options.computed, function(value, key) {
                    var splt = Strings.splitFirst(key, ":");
                    this.__properties.compute(splt.head, value, this, splt.tail.split(","));
                }, this);
                Objs.iter(options.events, function(value, key) {
                    this.on(key, value, this);
                }, this);
                Objs.iter(options.registerchannels, this.registerChannel, this);
                Objs.iter(options.channels, function(value, key) {
                    var splt = Strings.splitFirst(key, ":");
                    var channel = this.channel(splt.head);
                    if (channel)
                        this.listenOn(this.channel(splt.head), splt.tail, value, this);
                }, this);
                if (this.friendgroup || !parent)
                    this.friendgroup = this.auto_destroy(new Friendgroup(parent ? parent.friendgroup : null));
                else
                    this.friendgroup = parent.friendgroup;
                this.friends = {};
                this.__friends = options.friends;
                Objs.iter(this.__friends, function(value, key) {
                    this.friends[key] = this.friendgroup.watchScope(this, value);
                }, this);
            },

            friendgroup: false,

            destroy: function() {
                this.trigger("destroy");
                Objs.iter(this.__friends, function(value) {
                    this.friendgroup.unwatchScope(this, value);
                }, this);
                Objs.iter(this.__scopes, function(scope) {
                    scope.destroy();
                });
                Objs.iter(this.__children, function(child) {
                    child.destroy();
                });
                this.__properties.decreaseRef(this);
                if (this.__parent)
                    this.__parent.__remove(this);
                inherited.destroy.call(this);
            },

            __object_id_scope: function() {
                return this.__manager;
            },

            __add: function(child) {
                this.__children[child.cid()] = child;
                this.trigger("add", child);
            },

            __remove: function(child) {
                this.trigger("remove", child);
                delete this.__children[child.cid()];
            },

            data: function(key, value) {
                if (arguments.length === 0)
                    return this.__data;
                if (arguments.length === 1)
                    return this.__data[key];
                this.__data[key] = value;
                this.trigger("data", key, value);
                return this;
            },

            set: function(key, value, force) {
                if (this.destroyed())
                    return this;
                if (key in this.__extendables)
                    value = Objs.tree_extend(this.__properties.get(key) || {}, value);
                this.__properties.set(key, value, force);
                return this;
            },

            setAll: function(obj) {
                this.__properties.setAll(obj);
                return this;
            },

            hasKey: function(key) {
                return this.__properties.hasKey(key);
            },

            get: function(key) {
                return this.__properties.get(key);
            },

            setProp: function(key, value) {
                this.__properties.setProp(key, value);
                return this;
            },

            getProp: function(key) {
                return this.__properties.getProp(key);
            },

            define: function(name, func, ctx) {
                this.__functions[name] = Functions.as_method(func, ctx || this);
                return this;
            },

            /* Deprecated */
            call: function(name) {
                return this.execute.apply(this, arguments);
            },

            execute: function(name) {
                var args = Functions.getArguments(arguments, 1);
                try {
                    if (Types.is_string(name))
                        return this.__functions[name].apply(this, args);
                    else
                        return name.apply(this, args);
                } catch (e) {
                    return this.handle_call_exception(name, args, e);
                }
            },

            handle_call_exception: function(name, args, e) {
                throw e;
            },

            parent: function() {
                return this.__parent;
            },

            _eventChain: function() {
                return this.parent();
            },

            registerChannel: function(s) {
                this._channels[s] = this.auto_destroy(new Events());
            },

            channel: function(s) {
                if (!(s in this.__channelCache)) {
                    var result = null;
                    if (this._channels[s])
                        result = this._channels[s];
                    else if (this.__parent)
                        result = this.__parent.channel(s);
                    this.__channelCache[s] = result;
                }
                return this.__channelCache[s];
            },

            root: function() {
                return this.__root;
            },

            children: function() {
                return this.scope(">");
            },

            properties: function() {
                return this.__properties;
            },

            compute: function(key, callback, dependencies) {
                this.properties().compute(key, callback, this, dependencies);
            },

            scope: function(base, query) {
                if (arguments.length < 2) {
                    query = base;
                    base = this;
                }
                if (!query)
                    return base;
                if (base && base.instance_of(MultiScope))
                    base = base.iterator().next();
                if (!base)
                    return base;
                var ident = Ids.objectId(base) + "_" + query;
                if (!this.__scopes[ident])
                    this.__scopes[ident] = new MultiScope(this, base, query);
                return this.__scopes[ident];
            },

            bind: function(scope, key, options) {
                if (scope.instance_of(AbstractMultiScope)) {
                    var iter = scope.iterator();
                    while (iter.hasNext())
                        this.properties().bind(key, iter.next().properties(), options);
                    scope.on("addscope", function(s) {
                        this.properties().bind(key, s.properties(), options);
                    }, this);
                    scope.on("removescope", function(s) {
                        this.properties().unbind(key, s.properties());
                    }, this);
                } else
                    this.properties().bind(key, scope.properties(), options);
            }

        };
    }], {

        _extender: {
            functions: function(base, overwrite) {
                return Objs.extend(Objs.clone(base, 1), overwrite);
            },
            friends: function(base, overwrite) {
                return Objs.extend(Objs.clone(base, 1), overwrite);
            }

        }

    });
});