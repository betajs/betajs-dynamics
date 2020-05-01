/*!
betajs-dynamics - v0.0.142 - 2020-05-01
Copyright (c) Victor Lingenthal,Oliver Friedmann
Apache-2.0 Software License.
*/

(function () {
var Scoped = this.subScope();
Scoped.binding('module', 'global:BetaJS.Dynamics');
Scoped.binding('base', 'global:BetaJS');
Scoped.binding('browser', 'global:BetaJS.Browser');
Scoped.define("module:", function () {
	return {
    "guid": "d71ebf84-e555-4e9b-b18a-11d74fdcefe2",
    "version": "0.0.142",
    "datetime": 1588366423989
};
});
Scoped.assumeVersion('base:version', '~1.0.146');
Scoped.assumeVersion('browser:version', '~1.0.61');
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
                if (this._watchScopes[identifier])
                    this._watchScopes[identifier].addScope(scope);
            },

            unregisterScope: function(scope, identifier) {
                delete this._registeredScopes[identifier][scope.cid()];
                if (Types.is_empty(this._registeredScopes[identifier]))
                    delete this._registeredScopes[identifier];
                if (this._watchScopes[identifier])
                    this._watchScopes[identifier].removeScope(scope);
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
Scoped.define("module:Data.Mesh", [
    "base:Class",
    "base:Events.EventsMixin",
    "base:Properties.ObservableMixin",
    "base:Objs",
    "base:Types",
    "base:Strings",
    "base:Ids",
    "base:Functions",
    "base:Classes.SharedObjectFactory"
], function(Class, EventsMixin, ObservableMixin, Objs, Types, Strings, Ids, Functions, SharedObjectFactory, scoped) {
    return Class.extend({
        scoped: scoped
    }, [EventsMixin, function(inherited) {
        return {

            constructor: function(environment, context, defaults) {
                inherited.constructor.call(this);
                this.__environment = environment;
                this.__defaults = defaults;
                this.__context = context;
                this.__watchers = {};
                this.__acquiredProperties = {};
            },

            destroy: function() {
                Objs.iter(this.__watchers, function(watcher) {
                    this.__destroyWatcher(watcher);
                }, this);
                Objs.iter(this.__acquiredProperties, function(prop) {
                    prop.decreaseRef(this);
                }, this);
                inherited.destroy.call(this);
            },

            watch: function(expressions, callback, context) {
                Objs.iter(expressions, function(expression) {
                    var watcher = this.__createWatcher(expression);
                    watcher.cbs[Ids.objectId(context)] = {
                        callback: callback,
                        context: context
                    };
                }, this);
            },

            unwatch: function(expressions, context) {
                if (expressions) {
                    Objs.iter(expressions, function(expression) {
                        var watcher = this.__createWatcher(expression, true);
                        if (watcher) {
                            delete watcher.cbs[Ids.objectId(context)];
                            this.__destroyWatcher(watcher, true);
                        }
                    }, this);
                } else if (context) {
                    Objs.iter(this.__watchers, function(watcher) {
                        delete watcher.cbs[Ids.objectId(context)];
                        this.__destroyWatcher(watcher, true);
                    }, this);
                }
            },

            __destroyWatcher: function(watcher, weak) {
                if (Types.is_string(watcher))
                    watcher = this.__watchers[watcher];
                if (!watcher || (weak && !(Types.is_empty(watcher.cbs) && Types.is_empty(watcher.children))))
                    return;
                Objs.iter(watcher.children, this.__destroyWatcher, this);
                this.__unbindWatcher(watcher);
                if (watcher.parent)
                    delete watcher.parent.children[watcher.key];
                delete this.__watchers[watcher.expression];
                if (watcher.parent && Types.is_empty(watcher.parent.cbs) && Types.is_empty(watcher.parent.children))
                    this.__destroyWatcher(watcher.parent);
            },

            __createWatcher: function(expression, weak) {
                var watcher = this.__watchers[expression];
                if (watcher || weak)
                    return watcher;
                var split = Strings.splitLast(expression, ".");
                var parent = split.head ? this.__createWatcher(split.head) : null;
                watcher = {
                    cbs: {},
                    parent: parent,
                    key: split.tail,
                    expression: expression,
                    children: {},
                    properties: null,
                    propertiesPrefix: null
                };
                if (parent)
                    parent.children[split.tail] = watcher;
                this.__watchers[expression] = watcher;
                this.__bindWatcher(watcher);
                return watcher;
            },

            __unbindWatcher: function(watcher) {
                if (watcher.properties)
                    watcher.properties.off(null, null, watcher);
                Objs.iter(watcher.children, this.__unbindWatcher, this);
            },

            __bindWatcher: function(watcher) {
                var n = null;
                for (var i = this.__environment.length - 1; i >= 0; --i) {
                    var scope = this.__environment[i];
                    n = this._navigate(scope, watcher.expression);
                    if (n.properties && !n.tail)
                        break;
                    n = null;
                }
                if (n === null) {
                    var defScope = this.__defaults.watch || this.__environment[0];
                    n = this._navigate(defScope, watcher.expression);
                    if (!n.properties && ObservableMixin.__observable_guid === defScope.__observable_guid)
                        n.properties = defScope;
                    if (!n.properties)
                        n = null;
                }
                if (n === null)
                    return;
                watcher.properties = n.properties;
                var exp = n.head + (n.head && n.tail ? "." : "") + n.tail;
                watcher.propertiesPrefix = exp;
                var self = this;
                watcher.properties.on("change:" + watcher.propertiesPrefix, function(value, oldValue, force) {
                    Objs.iter(watcher.children, self.__unbindWatcher, self);
                    Objs.iter(watcher.children, self.__bindWatcher, self);
                    if (watcher.value != value || force) {
                        watcher.value = value;
                        Objs.iter(watcher.cbs, function(cb) {
                            cb.callback.apply(cb.context);
                        }, self);
                    }
                }, watcher);
                var value = watcher.properties.get(exp);
                if (value != watcher.value) {
                    watcher.value = value;
                    Objs.iter(watcher.cbs, function(cb) {
                        cb.callback.apply(cb.context);
                    }, this);
                }
                Objs.iter(watcher.children, this.__bindWatcher, this);
            },

            read: function(expression) {
                for (var i = this.__environment.length - 1; i >= 0; --i) {
                    var ret = this._read(this.__environment[i], expression);
                    if (ret) {
                        if (Types.is_function(ret.value))
                            return Functions.as_method(ret.value, ret.context);
                        return ret.value;
                    }
                }
                return null;
            },

            write: function(expression, value) {
                for (var i = this.__environment.length - 1; i >= 0; --i) {
                    if (this._write(this.__environment[i], expression, value, false))
                        return;
                }
                this._write(this.__defaults.write || this.__environment[0], expression, value, true);
            },

            execute: function(expressions, callback, readonly, factoryPassthrough) {
                var data = {};
                var exprs = [];
                Objs.iter(expressions, function(expression) {
                    var value = this.read(expression);
                    if (value !== null || !(Strings.splitFirst(expression, ".").head in window)) {
                        exprs.push(expression);
                        data[expression] = value;
                    }
                }, this);

                var expanded = this.__expand(data);

                var result = callback.call(this.__context, expanded);
                if (!readonly) {
                    var collapsed = this.__collapse(expanded, exprs);
                    for (var expression in collapsed) {
                        if (!(expression in data) || data[expression] != collapsed[expression])
                            this.write(expression, collapsed[expression]);
                    }
                }
                if (!factoryPassthrough && SharedObjectFactory.is_instance_of(result) && !result.destroyed()) {
                    result = result.acquire(this);
                    this.__acquiredProperties[result.cid()] = result;
                }
                return result;
            },

            _sub_navigate: function(properties, head, tail, parent, current) {
                var base = {
                    properties: properties,
                    head: head,
                    tail: tail,
                    parent: parent,
                    current: current
                };
                if (!tail || !current || !Types.is_object(current))
                    return base;
                var splt = Strings.splitFirst(tail, ".");
                var hd = head ? head + "." + splt.head : splt.head;
                if (SharedObjectFactory.is_instance_of(current) && !current.destroyed()) {
                    current = current.acquire(this);
                    this.__acquiredProperties[current.cid()] = current;
                }
                if (ObservableMixin.__observable_guid === current.__observable_guid && !current.destroyed()) {
                    if (current.hasKey(splt.head))
                        return this._sub_navigate(current, splt.head, splt.tail, current, current.get(splt.head));
                    else if (splt.head in current)
                        return this._sub_navigate(properties, hd, splt.tail, current, current[splt.head]);
                    else {
                        return {
                            properties: current,
                            head: splt.head,
                            tail: splt.tail,
                            parent: current,
                            current: null
                        };
                    }
                } else if (splt.head in current)
                    return this._sub_navigate(properties, hd, splt.tail, current, current[splt.head]);
                else
                    return base;
            },

            _navigate: function(scope, expression) {
                return this._sub_navigate(null, "", expression, null, scope);
            },

            _read: function(scope, expression) {
                var n = this._navigate(scope, expression);
                if (n.tail)
                    return null;
                return {
                    value: n.current,
                    context: n.parent == scope ? this.__context : n.parent
                };
            },

            _write: function(scope, expression, value, force) {
                var n = this._navigate(scope, expression);
                if (n.tail && !force)
                    return false;
                var tail = n.tail.split(".");
                if (n.properties)
                    n.properties.set(n.head + (n.head && n.tail ? "." : "") + n.tail, value);
                else {
                    var current = n.current;
                    for (var i = 0; i < tail.length - 1; ++i) {
                        current[tail[i]] = {};
                        current = current[tail[i]];
                    }
                    current[tail[tail.length - 1]] = value;
                }
                return true;
            },

            __expand: function(obj) {
                var result = {};
                Objs.iter(obj, function(value, key) {
                    var current = result;
                    var keys = key.split(".");
                    for (var i = 0; i < keys.length - 1; ++i) {
                        if (!(keys[i] in current) || !Types.is_object(current[keys[i]]) || current[keys[i]] === null)
                            current[keys[i]] = {};
                        current = current[keys[i]];
                    }
                    current[keys[keys.length - 1]] = value;
                });
                return result;
            },

            __collapse: function(obj, expressions) {
                var result = {};
                Objs.iter(expressions, function(expression) {
                    var keys = expression.split(".");
                    var current = obj;
                    for (var i = 0; i < keys.length; ++i)
                        current = current[keys[i]];
                    result[expression] = current;
                });
                return result;
            }

        };
    }]);
});
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
Scoped.define("module:Parser", [
    "base:Types",
    "base:Objs",
    "base:JavaScript"
], function(Types, Objs, JavaScript) {
    return {

        __cache: {},

        __functions: {},

        secureMode: false,

        compileFunction: function(code) {
            code = code.trim();
            if (!(code in this.__functions)) {
                if (this.secureMode)
                    throw ("Dynamics Secure Mode prevents creation of function code '" + code + "'.");
                /*jslint evil: true */
                try {
                    this.__functions[code] = new Function("obj", "with (obj) { return " + code + "; }");
                } catch (e) {
                    console.warn("Cannot compile `" + code + "` : " + e);
                    this.__functions[code] = function() {
                        return {};
                    };
                }
            }
            return this.__functions[code];
        },

        registerFunctions: function(codes) {
            this.__functions = Objs.extend(this.__functions, codes);
        },

        parseText: function(text) {
            if (!text)
                return null;
            var chunks = [];
            while (text) {
                var i = text.indexOf("{{");
                var dynamic = null;
                if (i === 0) {
                    i = text.indexOf("}}");
                    while (i + 2 < text.length && text.charAt(i + 2) == "}")
                        i++;
                    if (i >= 0) {
                        i += 2;
                        dynamic = this.parseCode(text.substring(2, i - 2));
                    } else
                        i = text.length;
                } else if (i < 0)
                    i = text.length;
                chunks.push(dynamic ? dynamic : text.substring(0, i));
                text = text.substring(i);
            }
            if (chunks.length == 1)
                return Types.is_string(chunks[0]) ? null : chunks[0];
            var dependencies = {};
            Objs.iter(chunks, function(chunk) {
                if (!Types.is_string(chunk)) {
                    Objs.iter(chunk.dependencies, function(dep) {
                        dependencies[dep] = true;
                    });
                }
            });
            return {
                func: function(obj) {
                    var s = null;
                    Objs.iter(chunks, function(chunk) {
                        var result = Types.is_string(chunk) ? chunk : chunk.func(obj);
                        s = s === null ? result : (s + result);
                    });
                    return s;
                },
                dependencies: Objs.keys(dependencies)
            };
        },

        parseCode: function(code) {
            var result = this.__cache[code];
            if (!result) {
                var bidirectional = false;
                var html = false;
                var noentities = false;
                var hidden = false;
                var c = code;
                if (c.charAt(0) === "?") {
                    hidden = true;
                    c = c.substring(1);
                }
                if (c.charAt(0) === "=") {
                    bidirectional = true;
                    c = c.substring(1);
                } else if (c.charAt(0) === "-") {
                    html = true;
                    c = c.substring(1);
                } else if (c.charAt(0) === "*") {
                    noentities = true;
                    c = c.substring(1);
                }
                var i = c.lastIndexOf("::");
                var args = null;
                if (i >= 0) {
                    args = c.substring(0, i).trim();
                    c = c.substring(i + 2);
                }
                result = {
                    bidirectional: bidirectional,
                    hidden: hidden,
                    html: html,
                    noentities: noentities,
                    args: args,
                    variable: bidirectional ? c : null,
                    func: this.compileFunction(c),
                    dependencies: Objs.keys(Objs.objectify(JavaScript.extractIdentifiers(c, true)))
                };
                this.__cache[code] = result;
            }
            return Objs.clone(result, 1);
        }

    };
});
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

            flipProp: function(key) {
                return this.setProp(key, !this.getProp(key));
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
Scoped.define("module:Exceptions.DynamicsCallException", [
    "base:Exceptions.Exception"
], function(Exception, scoped) {
    return Exception.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(clsname, methodname, args, e) {
                inherited.constructor.call(this, "Dynamics Exception in '" + clsname + "' calling method '" + methodname + "' : " + e);
            }

        };
    });
});

Scoped.define("module:Dynamic", [
    "module:Data.Scope",
    "module:Parser",
    "module:Handlers.HandlerMixin",
    "module:Exceptions.DynamicsCallException",
    "base:Objs",
    "base:Strings",
    "base:Types",
    "base:Functions",
    "base:Promise",
    "base:Events.Events",
    "base:Loggers.LoggableMixin",
    "module:Registries",
    "browser:Dom",
    "browser:Events",
    "base:Class"
], function(Scope, Parser, HandlerMixin, DynamicsCallException, Objs, Strings, Types, Functions, Promise, Events, LoggableMixin, Registries, Dom, DomEvents, Class, scoped) {
    var Cls;
    Cls = Scope.extend({
        scoped: scoped
    }, [HandlerMixin, LoggableMixin, function(inherited) {
        return {

            supportsGc: true,

            _notifications: {
                _activate: "__createActivate"
            },

            constructor: function(options) {
                this.initial = this.initial || {};
                options = Objs.extend(Objs.clone(this.initial, 1), options);
                this.domevents = Objs.extend(this.domevents, options.domevents);
                this.windowevents = Objs.extend(this.windowevents, options.windowevents);
                Objs.iter(this.cls.__initialForward, function(key) {
                    if (!(key in this))
                        return;
                    if (key in options) {
                        if (Types.is_object(this[key]) && Types.is_object(options[key]))
                            options[key] = Objs.extend(Objs.clone(this[key], 1), options[key]);
                    } else
                        options[key] = this[key];
                }, this);
                if (options.typedAttrs && options.types) {
                    Objs.iter(options.typedAttrs, function(value, key) {
                        options.attrs[key] = options.types[key] ? Types.parseType(value, options.types[key]) : value;
                    });
                }
                this.__dispose = options.dispose;
                Objs.iter(this.object_functions, function(key) {
                    this[key] = function() {
                        var args = Functions.getArguments(arguments);
                        args.unshift(key);
                        return this.execute.apply(this, args);
                    };
                }, this);
                if (!options.parent && options.parentHandler) {
                    var ph = options.parentHandler;
                    while (ph && !options.parent) {
                        options.parent = ph.instance_of(Cls) ? ph : null;
                        ph = ph._parentHandler;
                    }
                }
                inherited.constructor.call(this, options);
                if (options.bindAttrs) {
                    Objs.iter(options.bindAttrs, function(value, key) {
                        this.properties().bind(key, value, {
                            secondKey: key
                        });
                    }, this);
                }
                this.__references = options.references;
                Objs.iter(this.__references, function(reference) {
                    this.on("change:" + reference, function(newReference, oldReference) {
                        if (oldReference && Class.is_class_instance(oldReference) && !oldReference.destroyed())
                            oldReference.decreaseRef(this);
                        if (newReference && Class.is_class_instance(newReference) && !newReference.destroyed())
                            newReference.increaseRef(this);
                    }, this);
                    var ref = this.get(reference);
                    if (ref && Class.is_class_instance(ref) && !ref.destroyed())
                        ref.increaseRef(this);
                }, this);
                this._channels.global = this.cls.__globalEvents;
                if (options.tagName) {
                    this._tagName = options.tagName;
                    this.data("tagname", this._tagName);
                }
                this.functions = this.__functions;
                this._handlerInitialize(options);
                this.__createActivate = options.create || function() {};
                this.dom_events = {};
                this.window_events = {};
                this.__domEvents = new DomEvents();
                this.inheritables = (this.parent() ? this.parent().inheritables : []).concat(this.inheritables || []);
                this.friendgroup.registerScope(this, this.cls.registeredName());
                if (this.friendgroup && this.parent() && this.parent().friendgroup !== this.friendgroup)
                    this.parent().friendgroup.registerScope(this, this.cls.registeredName());
            },

            handle_call_exception: function(name, args, e) {
                Registries.throwException(new DynamicsCallException(this.cls.classname, name, args, e));
                return null;
            },

            hierarchyName: function() {
                return (this.parent() ? this.parent().hierarchyName() + " > " : "") + this.cls.registeredName();
            },

            _preAfterActivate: function(activeElement) {
                this.__domEvents.clear();
                var self = this;
                Objs.iter(this.domevents, function(target, event) {
                    var ev = event.split(" ");
                    var source = [activeElement];
                    if (ev.length > 1)
                        source = activeElement.querySelectorAll(ev[1]);
                    var f = function(eventData) {
                        self.execute(target, eventData, this);
                    };
                    for (var i = 0; i < source.length; ++i) {
                        this.__domEvents.on(source[i], ev[0], f);
                    }
                }, this);
                Objs.iter(this.windowevents, function(target, event) {
                    this.__domEvents.on(window, event, function(eventData) {
                        self.execute(target, eventData, this);
                    });
                }, this);
            },

            destroy: function() {
                if (this.friendgroup && this.parent() && this.parent().friendgroup !== this.friendgroup)
                    this.parent().friendgroup.unregisterScope(this, this.cls.registeredName());
                this.friendgroup.unregisterScope(this, this.cls.registeredName());
                if (this.free)
                    this.free();
                Objs.iter(this.__references, function(reference) {
                    var ref = this.get(reference);
                    if (ref && Class.is_class_instance(ref) && !ref.destroyed())
                        ref.decreaseRef(this);
                }, this);
                Objs.iter(this.__dispose, function(attr) {
                    var obj = this.get(attr);
                    this.set(attr, null);
                    if (obj && obj.weakDestroy)
                        obj.weakDestroy();
                }, this);
                this.__domEvents.destroy();
                inherited.destroy.call(this);
            }

        };
    }], {

        __initialForward: [
            "functions", "attrs", "extendables", "collections", "template", "create", "scopes", "bindings", "computed", "types", "events", "dispose", "channels", "registerchannels", "references", "friends"
        ],

        __globalEvents: new Events(),

        canonicName: function() {
            return this.classname ? Strings.last_after(this.classname, ".").toLowerCase() : "";
        },

        registeredName: function() {
            return this.__registeredName || ("ba-" + this.canonicName());
        },

        findByElement: function(element) {
            if (!element)
                return null;
            element = Dom.unbox(element);
            return element && element.dynamicshandler ? element.dynamicshandler : null;
        },

        findByElementPromise: function(element) {
            if (!element)
                return null;
            element = Dom.unbox(element);
            if (!element)
                return null;
            if (element.dynamicshandler)
                return Promise.value(element.dynamicshandler);
            element.dynamicshandlerpromise = element.dynamicshandlerpromise || [];
            var promise = Promise.create();
            element.dynamicshandlerpromise.push(promise);
            return promise;
        },

        register: function(key, registry) {
            registry = registry || Registries.handler;
            this.__registeredName = key || this.registeredName();
            registry.register(this.__registeredName, this);
            return this;
        },

        registerFunctions: function(code) {
            Parser.registerFunctions(code);
            return this;
        },

        activate: function(options) {
            var dyn = new this(options || {
                element: document.body,
                name_registry: true
            });
            dyn.activate();
            return dyn;
        },

        attachStringTable: function(stringTable) {
            this.__stringTable = stringTable;
            return this;
        },

        addStrings: function(strings) {
            this.__stringTable.register(strings, this.registeredName());
            return this;
        },

        string: function(key) {
            var result = null;
            if (this.__stringTable)
                result = this.__stringTable.get(key, this.registeredName());
            if (!result && this.parent.string)
                result = this.parent.string(key);
            return result;
        },

        stringUnicode: function(key) {
            var result = null;
            if (this.__stringTable)
                result = this.__stringTable.get(key, this.registeredName());
            if (!result && this.parent.string)
                result = this.parent.string(key);
            return Dom.entitiesToUnicode(result);
        },

        _extender: {
            events: function(base, overwrite) {
                return Objs.extend(Objs.clone(base, 1), overwrite);
            },
            types: function(base, overwrite) {
                return Objs.extend(Objs.clone(base, 1), overwrite);
            },
            registerchannels: function(base, overwrite) {
                return Objs.extend(Objs.clone(base, 1), overwrite);
            },
            channels: function(base, overwrite) {
                return Objs.extend(Objs.clone(base, 1), overwrite);
            },
            attrs: function(base, overwrite) {
                if (Types.is_function(base))
                    if (Types.is_function(overwrite)) {
                        return function() {
                            return Objs.extend(base.call(this), overwrite.call(this));
                        };
                    } else {
                        return function() {
                            return Objs.extend(base.call(this), overwrite);
                        };
                    }
                else if (Types.is_function(overwrite)) {
                    return function() {
                        return Objs.extend(Objs.clone(base, 1), overwrite.call(this));
                    };
                } else
                    return Objs.extend(Objs.clone(base, 1), overwrite);
            },
            inheritables: function(first, second) {
                return (first || []).concat(second || []);
            },
            dispose: function(first, second) {
                return (first || []).concat(second || []);
            },
            references: function(first, second) {
                return (first || []).concat(second || []);
            }
        }

    });
    return Cls;
});
Scoped.define("module:Exceptions.TagHandlerException", [
    "base:Exceptions.Exception"
], function(Exception, scoped) {
    return Exception.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(clsname, tag) {
                inherited.constructor.call(this, clsname + " is expecting a tag handler, but no registered tag handler for " + tag + " has been found.");
            }

        };
    });
});

Scoped.define("module:Handlers.Attr", [
    "base:Class",
    "module:Exceptions.TagHandlerException",
    "module:Parser",
    "base:Types",
    "base:Objs",
    "base:Async",
    "base:Strings",
    "module:Registries",
    "browser:Dom",
    "browser:Events"
], function(Class, TagHandlerException, Parser, Types, Objs, Async, Strings, Registries, Dom, Events, scoped) {
    var Cls;
    Cls = Class.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(node, attribute, dataNode) {
                inherited.constructor.call(this);
                this._dataNode = dataNode || node;
                this._node = node;
                this._tagHandler = null;
                this._attrName = attribute.name;
                this._isEvent = this._attrName.indexOf("on") === 0;
                this._updatable = !this._isEvent;
                this._attrValue = attribute.value;
                this._dyn = Parser.parseText(this._attrValue);
                if (this._dyn) {
                    var self = this;
                    this._dataNode.mesh().watch(this._dyn.dependencies, function() {
                        self.__updateAttr();
                    }, this);
                }
                this.updateElement(node.element(), attribute);
            },

            destroy: function() {
                if (this._partial)
                    this._partial.destroy();
                if (this._dyn)
                    this._dataNode.mesh().unwatch(this._dyn.dependencies, this);
                inherited.destroy.call(this);
            },

            __inputVal: function(el, value) {
                var valueKey = el.type === 'checkbox' || el.type === 'radio' ? 'checked' : 'value';
                if (arguments.length > 1) {
                    value = value === null || value === undefined ? "" : value;
                    if (el.type === "select-one") {
                        Async.eventually(function() {
                            el[valueKey] = value;
                        });
                    } else
                        el[valueKey] = value;
                }
                return el[valueKey];
            },

            _events: function() {
                if (!this.__events)
                    this.__events = this.auto_destroy(new Events());
                return this.__events;
            },

            updateElement: function(element, attribute) {
                this._element = element;
                attribute = attribute || element.attributes[this._attrName];
                this._attribute = attribute;
                var splt = Strings.splitFirst(this._attrName, ":");
                this._partialCls = Registries.partial.get(splt.head);
                if (this._partial) {
                    this._partial.destroy();
                    this._partial = null;
                }
                this.__updateAttr();
                if (this._partialCls) {
                    this._partial = Registries.partial.create(splt.head, this._node, this._dyn ? this._dyn.args : {}, this._attrValue, splt.tail);
                    if (this._partial.cls.meta.value_hidden)
                        this._attribute.value = "";
                }
                if (this._dyn) {
                    if (this._dyn.bidirectional && this._attrName == "value") {
                        this._events().on(this._element, "change keyup keypress keydown blur focus update input", function() {
                            this._dataNode.mesh().write(this._dyn.variable, this.__inputVal(this._element));
                        }, this);
                    }
                    if (this._isEvent) {
                        this._attribute.value = '';
                        this._events().on(this._element, this._attrName.substring(2), function() {
                            // Ensures the domEvent does not continue to
                            // overshadow another variable after the __executeDyn call ends.
                            var oldDomEvent = this._node._locals.domEvent;
                            this._node._locals.domEvent = arguments;
                            this._node.__executeDyn(this._dyn);
                            if (this._node && this._node._locals)
                                this._node._locals.domEvent = oldDomEvent;
                        }, this);
                    }
                }
            },

            __updateAttr: function() {
                if (!this._updatable)
                    return;
                var value = this._attrValue;
                if (this._dyn && (!this._partialCls || !this._partialCls.manualExecute))
                    value = this._dataNode.__executeDyn(this._dyn, false, !this._partialCls);
                if ((value != this._attrValue || Types.is_array(value)) && !(!value && !this._attrValue)) {
                    var old = this._attrValue;
                    this._attrValue = value;

                    if (!this._partial || !this._partial.cls.meta.value_hidden) {
                        var result = this._dyn.noentities ? value : Dom.entitiesToUnicode(value);


                        /*
                         *  Fixing a Safari bug. These three lines will cause Safari to crash: 
                         *     
                         *     <style> [class^="randomstring"] { background: white; } </style>
                         *	   <div class="" id="test"></div>
                         *	   <script> document.getElementById("test").attributes.class.value = null; </script>
                         *
                         */
                        if (result === null && this._attrName === "class")
                            result = "";

                        if (!this._dyn.hidden)
                            this._attribute.value = result;
                    }

                    if (this._partial)
                        this._partial.change(value, old);
                    if (this._attrName === "value" && this._element.value !== value)
                        this.__inputVal(this._element, value);
                    if (this._tagHandler && this._dyn && !this._partial)
                        this._tagHandler.properties().setProp(Registries.prefixNormalize(this._attrName), value);
                }
            },

            bindTagHandler: function(handler) {
                this.unbindTagHandler(this._tagHandler);
                this._tagHandler = handler;
                if (!this._partial) {
                    var innerKey = Registries.prefixNormalize(this._attrName);
                    if (innerKey) {
                        this._tagHandler.setArgumentAttr(innerKey, Class.is_pure_json(this._attrValue) ? Objs.clone(this._attrValue, 1) : this._attrValue);
                        if (this._dyn && this._dyn.bidirectional) {
                            if (Class.is_pure_json(this._attrValue)) {
                                this._tagHandler.properties().bind(innerKey, this._node._handler.properties(), {
                                    deep: true,
                                    left: true,
                                    right: true,
                                    secondKey: this._dyn.variable
                                });
                            } else {
                                if (innerKey.indexOf(".") >= 0) {
                                    this._tagHandler.on("dynamic-activated", function() {
                                        this._tagHandler.defaultMesh().watch([innerKey], function() {
                                            this._dataNode.mesh().write(this._dyn.variable, this._tagHandler.defaultMesh().read(innerKey));
                                        }, this);
                                    }, this);
                                } else {
                                    this._tagHandler.properties().on("change:" + innerKey, function(value) {
                                        this._dataNode.mesh().write(this._dyn.variable, value);
                                    }, this);
                                }
                            }
                        }
                    }
                } else if (this._partial) {
                    this._partial.bindTagHandler(handler);
                }
            },

            prepareTagHandler: function(createArguments) {
                if (this._partial)
                    this._partial.prepareTagHandler(createArguments);
            },

            unbindTagHandler: function(handler) {
                if (this._partial) {
                    this._partial.unbindTagHandler(handler);
                }
                if (this._tagHandler) {
                    this._tagHandler.properties().off(null, null, this);
                    this._tagHandler.off("dynamic-activated", null, this);
                    this._tagHandler.defaultMesh().unwatch(undefined, this);
                }
                this._tagHandler = null;
            },

            activate: function() {
                if (this._partial) {
                    if (this._partial.cls.meta.requires_tag_handler && !this._tagHandler) {
                        Registries.throwException(new TagHandlerException(this._partial.cls.classname, this._node.tag()));
                        return;
                    }
                    this._partial.activate();
                }
            },

            deactivate: function() {
                if (this._partial)
                    this._partial.deactivate();
            }

        };
    });
    return Cls;
});
Scoped.define("module:Handlers.HandlerMixin", [
    "base:Objs",
    "base:Strings",
    "base:Functions",
    "base:Types",
    "browser:Loader",
    "module:Handlers.Node",
    "module:Registries",
    "module:Handlers.HandlerNameRegistry",
    "browser:DomMutation.NodeRemoveObserver",
    "browser:Dom"
], function(Objs, Strings, Functions, Types, Loader, Node, Registries, HandlerNameRegistry, NodeRemoveObserver, Dom) {
    return {

        _notifications: {
            construct: "__handlerConstruct",
            destroy: "__handlerDestruct"
        },

        __handlerConstruct: function() {
            this._inheritableAttributes = {};
            this.__activated = false;
            this._mesh_extend = {
                string: Functions.as_method(this.string, this),
                stringUnicode: Functions.as_method(this.stringUnicode, this)
            };
        },

        __handlerDestruct: function() {
            Objs.iter(this.__rootNodes, function(node) {
                var element = node.element();
                node.destroy();
                if (this.remove_on_destroy)
                    element.innerHTML = "";
            }, this);
        },

        template: null,
        templateUrl: null,

        string: function(key) {
            if (this.cls.string)
                return this.cls.string(key);
            if (this.parent())
                return this.parent().string(key);
            return key;
        },

        stringUnicode: function(key) {
            if (this.cls.stringUnicode)
                return this.cls.stringUnicode(key);
            if (this.parent())
                return this.parent().stringUnicode(key);
            return key;
        },

        remove_on_destroy: false,

        _handlerInitialize: function(options) {
            options = options || {};
            if (options.name_registry)
                this.__nameRegistry = this.auto_destroy(new HandlerNameRegistry());
            this.__types = options.types || {};
            this._parentHandler = options.parentHandler || null;
            this._parentElement = options.parentElement;
            this._argumentAttrs = {};
            this.template = options.template || this.template;
            this.templateUrl = options.templateUrl || this.templateUrl;
            if (this.templateUrl)
                this.templateUrl = Strings.replaceAll(this.templateUrl, "%", Strings.last_after(this.cls.classname || "", ".").toLowerCase());
            this.__elements = options.element ? [Dom.unbox(options.element)] : [];
            var initialContentElement = Dom.unbox(options.element ? options.element : this._parentElement);
            if (!initialContentElement)
                throw (this.cls.classname + " requires an existing DOM element to attach to.");
            this.initialContent = initialContentElement.innerHTML;
            this.__activeElement = options.element ? Dom.unbox(options.element) : Dom.unbox(this._parentElement);
            if (options.remove_observe) {
                this.__removeObserver = this.auto_destroy(NodeRemoveObserver.create(this.__activeElement));
                this.__removeObserver.on("node-removed", function() {
                    this.weakDestroy();
                }, this);
            }
            this.__activeElement.dynamicshandler = this;
        },

        _handlerInitializeTemplate: function(template, parentElement) {
            var compiled = Registries.templates.create(template);
            if (this.__elements.length > 0) {
                this.__activeElement = this.__elements[0];
                this.__elements[0].innerHTML = "";
                compiled.forEach(function(child) {
                    this.__elements[0].appendChild(child);
                }, this);
            } else if (parentElement) {
                this.__activeElement = Dom.unbox(parentElement);
                this.__elements = compiled;
                this.__activeElement.innerHTML = "";
                compiled.forEach(function(child) {
                    this.__activeElement.appendChild(child);
                }, this);
            } else {
                this.__elements = compiled;
                this.__activeElement = this.__elements[0].parentNode;
            }
        },

        nameRegistry: function() {
            return this.__nameRegistry || (this.parent() ? this.parent().nameRegistry() : null);
        },

        byName: function(name) {
            return this.nameRegistry().get(name);
        },

        __assocs: {},

        addAssoc: function(name, registeredName) {
            this.__assocs[name] = registeredName;
        },

        removeAssoc: function(name) {
            delete this.__assocs[name];
        },

        activated: function() {
            return this.__activated;
        },

        assoc: function(name) {
            return this.byName(this.__assocs[name] || name);
        },

        setArgumentAttr: function(key, value) {
            if (key in this.__extendables)
                value = Objs.tree_extend(this.properties().get(key) || {}, value);
            if (this.__types[key])
                value = Types.parseType(value, this.__types[key]);
            this.properties().setProp(key, value);
            this._argumentAttrs[key] = true;
        },

        isArgumentAttr: function(key) {
            return !!this._argumentAttrs[key];
        },

        activeElement: function() {
            return this.__activeElement;
        },

        // Deprecated
        element: function() {
            return this.__elements;
        },

        _updateActiveElement: function(activeElement) {
            this.__activeElement = Dom.unbox(activeElement);
            if (this.__removeObserver) {
                this.__removeObserver.weakDestroy();
                this.__removeObserver = this.auto_destroy(NodeRemoveObserver.create(this.__activeElement));
                this.__removeObserver.on("node-removed", function() {
                    this.weakDestroy();
                }, this);
            }
        },

        _deferActivate: function() {
            return false;
        },

        activate: function() {
            if (this._deferActivate())
                return;
            if (this.__activated)
                return;
            this.__activated = true;
            if (this.template)
                this._handlerInitializeTemplate(this.template, this._parentElement);
            else {
                if (this.templateUrl) {
                    this.__activated = false;
                    Loader.loadHtml(this.templateUrl, function(template) {
                        this.templateUrl = null;
                        this.template = template;
                        this.activate();
                    }, this);
                    return;
                }
            }

            this._notify("_activate");
            this.__rootNodes = [];
            this.__elements.forEach(function(element) {
                this.__rootNodes.push(new Node(this, null, element));
            }, this);
            this._preAfterActivate(this.__activeElement);
            this._afterActivate(this.__activeElement);
            if (this.__activeElement.dynamicshandlerpromise) {
                this.__activeElement.dynamicshandlerpromise.forEach(function(promise) {
                    promise.asyncSuccess(this.__activeElement.dynamicshandler);
                }, this);
                this.__activeElement.dynamicshandlerpromise = null;
                try {
                    delete this.__activeElement.dynamicshandlerpromise;
                } catch (e) {}
            }
            this.trigger("dynamic-activated");
        },

        _afterActivate: function(activeElement) {},

        defaultMesh: function() {
            return this.__rootNodes[0].mesh();
        },

        registerInheritableAttribute: function(tagName, attrKey, attrValue, node) {
            tagName = Registries.prefixNormalize(tagName, true);
            this._inheritableAttributes[tagName] = this._inheritableAttributes[tagName] || {};
            this._inheritableAttributes[tagName][attrKey] = {
                value: attrValue,
                name: attrKey,
                node: node
            };
        },

        unregisterInheritableAttribute: function(tagName, attrKey) {
            tagName = Registries.prefixNormalize(tagName, true);
            if (this._inheritableAttributes[tagName]) {
                delete this._inheritableAttributes[tagName][attrKey];
                if (Types.is_empty(this._inheritableAttributes[tagName]))
                    delete this._inheritableAttributes[tagName];
            }
        },

        getInheritableAttributes: function(tagName) {
            tagName = Registries.prefixNormalize(tagName, true);
            return Objs.values(this._inheritableAttributes[tagName]);
        }

    };
});


Scoped.define("module:Handlers.Handler", [
    "base:Class",
    "module:Handlers.HandlerMixin",
    "base:Properties.Properties",
    "module:Registries"
], function(Class, HandlerMixin, Properties, Registries, scoped) {
    return Class.extend({
        scoped: scoped
    }, [HandlerMixin, function(inherited) {
        return {

            constructor: function(options) {
                inherited.constructor.call(this);
                options = options || {};
                this._properties = options.properties ? options.properties : new Properties();
                this.functions = {};
                this._handlerInitialize(options);
            },

            properties: function() {
                return this._properties;
            }

        };
    }], {

        register: function(key, registry) {
            registry = registry || Registries.handler;
            registry.register(key, this);
        }

    });
});




Scoped.define("module:Handlers.HandlerNameRegistry", [
    "base:Class", "base:Objs"
], function(Class, Objs, scoped) {
    return Class.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            __handlers: {},

            destroy: function() {
                Objs.iter(this.__handlers, function(value, name) {
                    this.unregister(name);
                }, this);
                inherited.destroy.call(this);
            },

            register: function(handler, name) {
                this.unregister(name);
                this.__handlers[name] = handler;
                handler.on("destroy", function() {
                    this.unregister(name);
                }, this);
            },

            unregister: function(name) {
                if (name in this.__handlers) {
                    var handler = this.__handlers[name];
                    delete this.__handlers[name];
                    if (!handler.destroyed())
                        handler.off(null, null, this);
                }
            },

            get: function(name) {
                return this.__handlers[name];
            }

        };

    });
});
Scoped.define("module:Handlers.Node", [
    "base:Class",
    "base:Events.EventsMixin",
    "base:Ids",
    "browser:Dom",
    "browser:Info",
    "module:Parser",
    "module:Data.Mesh",
    "base:Objs",
    "base:Types",
    "module:Registries",
    "module:Handlers.Attr"
], function(Class, EventsMixin, Ids, Dom, Info, Parser, Mesh, Objs, Types, Registries, Attr, scoped) {
    var Cls;
    Cls = Class.extend({
        scoped: scoped
    }, [EventsMixin, function(inherited) {
        return {

            constructor: function(handler, parent, element, locals) {
                inherited.constructor.call(this);
                this._handler = handler;
                this._parent = parent;
                if (parent)
                    parent._children[Ids.objectId(this)] = this;
                this._element = element;
                try {
                    if (element)
                        element.dynnodehandler = this;
                } catch (e) {}

                this._tag = element.tagName ? element.tagName.toLowerCase() : "";
                if (this._tag.indexOf(":") >= 0)
                    this._tag = this._tag.substring(this._tag.indexOf(":") + 1);
                this._dynTag = Parser.parseText(this._tag);
                this._tagHandler = null;

                this._template = element.outerHTML;
                this._innerTemplate = element.innerHTML;
                this._locals = locals || {};
                this._active = true;
                this._dyn = null;
                this._children = {};
                this._locked = true;
                this._attrs = {};
                this._expandChildren = true;
                this._touchedInner = false;

                this._mesh = new Mesh([window, this.properties(), this._locals, this._handler.functions, this._handler.friends || {}, this._handler._mesh_extend], this._handler, {
                    read: this.properties(),
                    write: this.properties(),
                    watch: this.properties()
                });

                if (this._element.attributes) {
                    // Copy attributes first before registering it, preventing a bug when partials add attributes during initialization
                    var attrs = [];
                    for (var i = 0; i < this._element.attributes.length; ++i)
                        attrs.push(this._element.attributes[i]);
                    Objs.iter(attrs, this._registerAttr, this);
                }

                this._locked = false;
                this._active = !this._active;
                if (this._active)
                    this.deactivate();
                else
                    this.activate();
            },

            destroy: function() {
                Objs.iter(this._attrs, function(attr) {
                    attr.destroy();
                });
                this._removeChildren();
                if (this._tagHandler && !this._tagHandler.destroyed()) {
                    if (this._tagHandler.cacheable && this._tagHandler.cls.cacheable)
                        Registries.handlerCache.suspend(this._tagHandler, this._element);
                    else
                        this._tagHandler.weakDestroy();
                }
                if (this._dyn)
                    this.properties().off(null, null, this._dyn);
                if (this._parent)
                    delete this._parent._children[Ids.objectId(this)];
                this._mesh.destroy();
                inherited.destroy.call(this);
            },

            _registerAttr: function(attribute) {
                if (attribute.name in this._attrs)
                    // Is this ever being called? The method doesn't exist!?
                    this._attrs[attribute.name].updateAttribute(attribute);
                else
                    this._attrs[attribute.name] = new Attr(this, attribute);
            },

            tag: function() {
                return this._tag;
            },

            element: function() {
                return this._element;
            },

            __dynOff: function(dyn) {
                this._mesh.unwatch(dyn.dependencies, dyn);
            },

            __dynOn: function(dyn, cb) {
                var self = this;
                this._mesh.watch(dyn.dependencies, function() {
                    cb.apply(self);
                }, dyn);
            },

            mesh: function() {
                return this._mesh;
            },

            __executeDyn: function(dyn, readonly, factoryPassthrough) {
                return Types.is_object(dyn) ? this._mesh.execute(dyn.dependencies, dyn.func, readonly, factoryPassthrough) : dyn;
            },

            __tagValue: function() {
                if (!this._dynTag)
                    return this._tag;
                return this.__executeDyn(this._dynTag, true);
            },

            __unregisterTagHandler: function() {
                if (this._tagHandler) {
                    Objs.iter(this._attrs, function(attr) {
                        attr.unbindTagHandler(this._tagHandler);
                    }, this);
                    this.off(null, null, this._tagHandler);
                    if (this._tagHandler.cacheable && this._tagHandler.cls.cacheable)
                        Registries.handlerCache.suspend(this._tagHandler, this._element);
                    else
                        this._tagHandler.weakDestroy();
                    this._tagHandler = null;
                    Objs.iter(this._handler.getInheritableAttributes(this.__tagValue()), function(attr) {
                        this._attrs[attr.name].weakDestroy();
                        delete this._attrs[attr.name];
                    }, this);
                }
            },

            __registerTagHandler: function() {
                this.__unregisterTagHandler();
                var tagv = this.__tagValue();
                if (!tagv)
                    return;
                if (this._dynTag && this._element.tagName.toLowerCase() != tagv.toLowerCase()) {
                    this._element = Dom.changeTag(this._element, tagv);
                    Objs.iter(this._attrs, function(attr) {
                        attr.updateElement(this._element);
                    }, this);
                }
                if (!Registries.handler.get(tagv))
                    return false;
                if (Info.isInternetExplorer() && Info.internetExplorerVersion() < 9) {
                    var isActiveElement = this._element === this._handler.activeElement();
                    this._element = Dom.changeTag(this._element, tagv);
                    Objs.iter(this._attrs, function(attr) {
                        attr.updateElement(this._element);
                    }, this);
                    if (isActiveElement)
                        this._handler._updateActiveElement(this._element);
                }
                var createArguments = {
                    parentElement: this._element,
                    parentHandler: this._handler,
                    autobind: false,
                    cacheable: false,
                    tagName: tagv
                };
                Objs.iter(this._handler.getInheritableAttributes(this.__tagValue()), function(attr) {
                    this._attrs[attr.name] = new Attr(attr.node, attr);
                }, this);
                Objs.iter(this._attrs, function(attr) {
                    attr.prepareTagHandler(createArguments);
                }, this);
                if (createArguments.ignoreTagHandler)
                    return;
                if (createArguments.cacheable)
                    this._tagHandler = Registries.handlerCache.resume(tagv, this._element, this._handler);
                if (!this._tagHandler)
                    this._tagHandler = Registries.handler.create(tagv, createArguments);
                Objs.iter(this._handler.inheritables, function(key) {
                    this._tagHandler.set(key, this._handler.get(key));
                }, this);
                Objs.iter(this._attrs, function(attr) {
                    attr.bindTagHandler(this._tagHandler);
                }, this);
                this._tagHandler.activate();
                return true;
            },

            activate: function() {
                if (this._locked || this._active)
                    return;
                this._locked = true;
                this._active = true;
                if (this._dynTag) {
                    this.__dynOn(this._dynTag, function() {
                        this.__registerTagHandler();
                    });
                }
                var registered = this.__registerTagHandler();
                if (!registered && this._expandChildren) {
                    if (this._restoreInnerTemplate)
                        this._element.innerHTML = this._innerTemplate;
                    this._touchedInner = true;
                    if (this._element.nodeType == 3) {
                        this._dyn = Parser.parseText(this._element.textContent || this._element.innerText || this._element.nodeValue);
                        if (this._dyn) {
                            this.__dynOn(this._dyn, function() {
                                this.__updateDyn();
                            });
                        }
                    }
                    this.__updateDyn(true);
                    for (var i = 0; i < this._element.childNodes.length; ++i)
                        if (!this._element.childNodes[i]["ba-handled"])
                            this._registerChild(this._element.childNodes[i]);
                }
                Objs.iter(this._attrs, function(attr) {
                    attr.activate();
                });
                this._locked = false;
            },

            __updateDyn: function(force) {
                if (!this._dyn)
                    return;
                var value = this.__executeDyn(this._dyn);
                if (force || value != this._dyn.value) {
                    this._dyn.value = value;
                    var htmlElement = null;
                    if (this._dyn.html) {
                        htmlElement = Dom.elementByTemplate(value, true);
                        if (htmlElement) {
                            (this._htmlElement || this._element).replaceWith(htmlElement);
                            this._htmlElement = htmlElement;
                        }
                    }
                    if (!htmlElement) {
                        value = value === null ? "" : value;
                        var converted = this._dyn.noentities ? value : Dom.entitiesToUnicode(value);
                        if ("textContent" in this._element)
                            this._element.textContent = converted;
                        if ("innerText" in this._element)
                            this._element.innerText = converted;
                        if (Info.isInternetExplorer() && Info.internetExplorerVersion() < 9 && ("data" in this._element))
                            this._element.data = converted;
                    }
                }
            },

            _registerChild: function(element, locals) {
                return new Cls(this._handler, this, element, Objs.extend(Objs.clone(this._locals, 1), locals));
            },

            _removeChildren: function() {
                Objs.iter(this._children, function(child) {
                    child.destroy();
                });
            },

            deactivate: function() {
                if (!this._active)
                    return;
                this._active = false;
                if (this._locked)
                    return;
                this._locked = true;
                Objs.iter(this._attrs, function(attr) {
                    attr.deactivate();
                });
                this._removeChildren();
                if (this._dynTag)
                    this.__dynOff(this._dynTag);
                this.__unregisterTagHandler();
                if (this._dyn) {
                    this.__dynOff(this._dyn);
                    this._dyn = null;
                }
                if (this._touchedInner)
                    this._element.innerHTML = "";
                this._restoreInnerTemplate = true;
                this._locked = false;
            },

            properties: function() {
                return this._handler.properties();
            }

        };
    }]);
    return Cls;
});
Scoped.define("module:Handlers.Partial", [
    "base:Class",
    "base:JavaScript",
    "base:Functions",
    "base:Strings",
    "module:Parser",
    "module:Registries"
], function(Class, JavaScript, Functions, Strings, Parser, Registries, scoped) {
    return Class.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(node, args, value, postfix) {
                inherited.constructor.call(this);
                this._node = node;
                this._args = args;
                this._value = value;
                this._active = false;
                this._postfix = postfix;
            },

            change: function(value, oldValue) {
                this._value = value;
                this._change(value, oldValue);
                this._apply(value, oldValue);
            },

            activate: function() {
                if (this._active)
                    return;
                this._active = true;
                this._activate();
                this._apply(this._value, null);
            },

            deactivate: function() {
                if (!this._active)
                    return;
                this._active = false;
                this._deactivate();
            },

            bindTagHandler: function(handler) {},

            unbindTagHandler: function(handler) {},

            prepareTagHandler: function(createArguments) {},

            _change: function(value, oldValue) {},

            _activate: function() {},

            _deactivate: function() {},

            _apply: function(value, oldValue) {},

            _execute: function(code) {
                code = code || this._value;
                var dyn = Parser.parseText(code) || Parser.parseCode(code);
                this._node.__executeDyn(dyn);
            },

            _valueExecute: function(args) {
                var value = this._value.trim();
                var simplified = value;
                if (Strings.starts_with(simplified, "{{") && Strings.ends_with(simplified, "}}"))
                    simplified = Strings.strip_end(Strings.strip_start(simplified, "{{"), "}}");
                if (JavaScript.isProperIdentifier(simplified)) {
                    args = Functions.getArguments(args);
                    args.unshift(simplified);
                    this._node._handler.execute.apply(this._node._handler, args);
                } else
                    this._execute(value);
            }


        };
    }, {

        meta: {
            // value_hidden: false
            // requires_tag_handler: false
        },

        canonicName: function() {
            return this.classname ? Strings.last_after(this.classname, ".").toLowerCase() : "";
        },

        registeredName: function() {
            return this.__registeredName || ("ba-" + this.canonicName());
        },

        register: function(key, registry) {
            registry = registry || Registries.partial;
            this.__registeredName = key || this.registeredName();
            registry.register(this.__registeredName, this);
        }

    });
});
Scoped.define("module:Registries", [
    "base:Classes.ClassRegistry",
    "base:Exceptions.AsyncExceptionThrower",
    "browser:Dom",
    "base:Strings"
], function(ClassRegistry, AsyncExceptionThrower, Dom, Strings) {
    return {

        handler: new ClassRegistry({}, true),
        partial: new ClassRegistry({}, true),
        prefixes: {
            "ba": true
        },

        prefixNormalize: function(s, returnOriginal) {
            var splt = Strings.splitFirst(s || "", "-");
            return this.prefixes[splt.head] ? splt.tail : s;
        },

        templates: {

            cache: {},

            create: function(template) {
                template = template.trim();
                var cached = this.cache[template];
                if (!cached) {
                    if (template.indexOf("<") === 0)
                        cached = Dom.elementsByTemplate(template);
                    else
                        cached = [document.createTextNode(template)];
                    this.cache[template] = cached;
                }
                return cached.map(function(element) {
                    return element.cloneNode(true);
                });
            }

        },

        throwException: function(e) {
            try {
                if (!this.exceptionThrower)
                    this.exceptionThrower = new AsyncExceptionThrower();
                this.exceptionThrower.throwException(e);
            } catch (ex) {}
        },

        handlerCache: {

            cache: {},
            cacheDom: null,

            suspend: function(handler, element) {
                element = Dom.unbox(element);
                if (!this.cacheDom) {
                    this.cacheDom = document.createElement("div");
                    this.cacheDom.setAttribute("ba-ignore", "");
                    this.cacheDom.style.display = "none";
                    document.body.appendChild(this.cacheDom);
                }
                var name = handler.data("tagname");
                this.cache[name] = this.cache[name] || [];
                var children = [];
                for (var i = 0; i < element.children.length; ++i)
                    children.push(element.children[i]);
                this.cache[name].push({
                    handler: handler,
                    elements: children
                });
                children.forEach(function(child) {
                    this.cacheDom.appendChild(child);
                }, this);
            },

            resume: function(name, element, parentHandler) {
                element = Dom.unbox(element);
                if (!this.cache[name] || this.cache[name].length === 0)
                    return null;
                var record = this.cache[name].shift();
                element.innerHTML = "";
                record.elements.forEach(function(child) {
                    element.appendChild(child);
                });
                record.handler._handlerInitialize({
                    parentHandler: parentHandler,
                    parentElement: element
                });
                return record.handler;
            }

        }

    };
});
Scoped.define("module:Partials.AssocPartial", ["module:Handlers.Partial"], function(Partial, scoped) {
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(node, args, value, postfix) {
                inherited.constructor.apply(this, arguments);
                this._node._handler.addAssoc(postfix, value);
            },

            destroy: function() {
                this._node._handler.removeAssoc(this._postfix);
                inherited.destroy.call(this);
            }

        };
    });
    Cls.register("ba-assoc");
    return Cls;
});
Scoped.define("module:Partials.AttrsPartial", [
    "module:Handlers.Partial",
    "base:Objs",
    "base:Class"
], function(Partial, Objs, Class, scoped) {
    /**
     * @name ba-attrs
     *
     * @description
     * The ba-attrs partial allows the specification of an object that will
     * provide attributes accessible within the element containing the ba-attrs
     * html attribute.
     *
     * @param {object} baAttrs Object containing individual attributes.
     *
     * @example <div ba-attrs="{{{test: 'hi'}}}">{{test}}</div>
     * // Evaluates to <div ba-attrs="{{{test: 'hi'}}}">hi</div>
     */
    var Cls = Partial.extend({
        scoped: scoped
    }, {

        _apply: function(value) {
            if (!this._active)
                return;
            var props = this._node._tagHandler ? this._node._tagHandler.properties() : this._node.properties();
            for (var key in value)
                props.set(key, value[key]);
        },

        bindTagHandler: function(handler) {
            for (var key in this._value)
                handler.setArgumentAttr(key, Class.is_pure_json(this._value[key]) ? Objs.clone(this._value[key], 1) : this._value[key]);
        }

    });
    Cls.register("ba-attrs");
    return Cls;
});
Scoped.define("module:Partials.CachePartial", ["module:Handlers.Partial"], function(Partial, scoped) {
    var Cls = Partial.extend({
        scoped: scoped
    }, {

        bindTagHandler: function(handler) {
            handler.cacheable = true;
        },

        prepareTagHandler: function(createArguments) {
            createArguments.cacheable = true;
        }

    }, {

        meta: {
            requires_tag_handler: true
        }

    });
    Cls.register("ba-cache");
    return Cls;
});
Scoped.define("module:Partials.ClassPartial", [
    "module:Handlers.Partial",
    "browser:Dom"
], function(Partial, Dom, scoped) {
    /**
     * @name ba-class
     *
     * @description
     * Dynamically set the HTML class of the given element based on the evaluation
     * of expressions.
     *
     * @param {object} baClass Object where keys are Html classes and values are
     * expressions. If the expression evaluates to true, the class is included on
     * the Html element. If the expression evaluates to false, the class is not
     * included.
     *
     * @example <div ba-class="{{{'first': true, 'second': 1 === 2}}}></div>"
     * // Evaluates to <div class="first"></div>
     */
    var Cls = Partial.extend({
        scoped: scoped
    }, {

        _apply: function(value) {
            for (var key in value) {
                var hasClass = Dom.elementHasClass(this._node.element(), key);
                var newHasClass = !!value[key];
                if (newHasClass === hasClass)
                    continue;
                if (newHasClass)
                    Dom.elementAddClass(this._node.element(), key);
                else
                    Dom.elementRemoveClass(this._node.element(), key);
            }
        }

    });
    Cls.register("ba-class");
    return Cls;
});
Scoped.define("module:Partials.ClickPartial", [
    "module:Handlers.Partial",
    "browser:Events"
], function(Partial, Events, scoped) {
    /**
     * @name ba-click
     *
     * @description
     * The ba-click partial allows the specification of custom on clicked
     * behavior. By default, the click propagation is prevented. Should you want
     * the click to propagate, use the `onclick` Html tag.
     *
     * @param {expression} baClick Expression to evaluate upon click. If click is
     * within the scope of another directive, the Expression can be an exposed method of
     * the parent directive.
     *
     * @example <button ba-click="showing = !showing">
     * // Expression is evaluated (ex. showing now equals inverse) on click.
     *
     * @example <button ba-click="exposedMethod()">
     * // Calls parentDirective.call("exposedMethod") on click.
     *
     * @example <button ba-click="exposedMethod(arg)">
     * // Calls parentDirective.call("exposedMethod", arg) on click.
     */
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(node, args, value) {
                inherited.constructor.apply(this, arguments);
                var events = this.auto_destroy(new Events());
                events.on(this._node.element(), "click", function(e) {
                    e.stopPropagation();
                    this.executeAction();
                }, this);
            },

            executeAction: function() {
                this._execute();
            }

        };
    }, {

        manualExecute: true

    });
    Cls.register("ba-click");
    return Cls;
});
Scoped.define("module:Partials.DataPartial", ["module:Handlers.Partial"], function(Partial, scoped) {
    var Cls = Partial.extend({
        scoped: scoped
    }, {

        _apply: function(value) {
            this._node._tagHandler.data(this._postfix, value);
        },

        bindTagHandler: function(handler) {
            this._apply(this._value);
        }

    }, {

        meta: {
            requires_tag_handler: true
        }

    });
    Cls.register("ba-data");
    return Cls;
});
Scoped.define("module:Partials.DeeperPartial", ["module:Handlers.Partial"], function(Partial, scoped) {
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            bindTagHandler: function(handler) {
                var splt = this._postfix.split(":");
                handler.registerInheritableAttribute(splt[0], splt[1], this._value, this._node);
            },

            unbindTagHandler: function(handler) {
                if (!handler)
                    return;
                var splt = this._postfix.split(":");
                handler.unregisterInheritableAttribute(splt[0], splt[1]);
            }

        };
    }, {

        manualExecute: true

    });
    Cls.register("ba-deeper");
    return Cls;
});
Scoped.define("module:Partials.EventForwardPartial", [
    "module:Handlers.Partial",
    "base:Functions"
], function(Partial, Functions, scoped) {
    var Cls = Partial.extend({
        scoped: scoped
    }, {

        bindTagHandler: function(handler) {
            handler.on("all", function() {
                var eventName = arguments[0];
                if (eventName.indexOf("change:") === 0)
                    return;
                var args = Functions.getArguments(arguments, 1);
                var result = [eventName];
                var pf = this._postfix.trim();
                if (pf) {
                    if (pf.indexOf("~") === 0) {
                        pf = pf.substring(1);
                        if (eventName.indexOf(pf) === 0)
                            result = [eventName.substring(pf.length + 1)];
                    } else
                        result = [pf + "-" + eventName];
                }
                if (this._value)
                    result = result.concat(this._value);
                result = result.concat(args);
                this._node._handler.trigger.apply(this._node._handler, result);
            }, this, {
                off_on_destroyed: true
            });
        },

        unbindTagHandler: function(handler) {
            if (handler)
                handler.off(null, null, this);
        }

    });
    Cls.register("ba-event-forward");
    return Cls;
});
Scoped.define("module:Partials.EventPartial", [
    "module:Handlers.Partial",
    "base:Functions"
], function(Partial, Functions, scoped) {
    var Cls = Partial.extend({
        scoped: scoped
    }, {

        bindTagHandler: function(handler) {
            var pf = this._postfix.trim();
            var fwd = pf.indexOf("~") === 0;
            if (fwd)
                pf = pf.substring(1);
            handler.on(pf, function() {
                if (fwd) {
                    var args = Functions.getArguments(arguments);
                    args.unshift(this._value || pf);
                    this._node._handler.trigger.apply(this._node._handler, args);
                } else
                    this._valueExecute(arguments);
            }, this);
        }

    }, {

        manualExecute: true

    });
    Cls.register("ba-event");
    return Cls;
});
Scoped.define("module:Partials.FunctionsPartial", ["module:Handlers.Partial", "browser:Info", "base:Objs"], function(Partial, Info, Objs, scoped) {
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            bindTagHandler: function(handler) {
                Objs.extend(handler.__functions, this._value);
            }

        };
    });
    Cls.register("ba-functions");
    return Cls;
});
Scoped.define("module:Partials.GcPartial", ["module:Handlers.Partial"], function(Partial, scoped) {
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            bindTagHandler: function(handler) {
                if (this._value)
                    handler.enableGc(this._value);
            }

        };
    });
    Cls.register("ba-gc");
    return Cls;
});
Scoped.define("module:Partials.HotkeyPartial", [
    "module:Handlers.Partial",
    "browser:Events",
    "browser:Hotkeys"
], function(Partial, Events, Hotkeys, scoped) {
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(node, args, value) {
                inherited.constructor.apply(this, arguments);
                var events = this.auto_destroy(new Events());
                var hotkey = this._postfix;
                events.on(this._node._element, "keydown", function(e) {
                    if (Hotkeys.handleKeyEvent(hotkey, e))
                        this._valueExecute([e]);
                }, this);
            }

        };
    }, {

        manualExecute: true

    });
    Cls.register("ba-hotkey");
    return Cls;
});
Scoped.define("module:Partials.IfPartial", ["module:Partials.ShowPartial"], function(Partial, scoped) {
    /**
     * @name ba-if
     *
     * @description
     * The ba-if partial controls rendering of internal Html based on the truth
     * value of a given expression. It differs from ba-show in that ba-show
     * renders internal Html, but hides it, while ba-if will not render the
     * internal Html at all.
     *
     * @param {expression} baIf Expression to evaluate for truth. If true,
     * internal html will be rendered. If false, internal html will not be
     * rendered. Note, if the expression should be evaluted, it must be wrapped in
     * {{}}. See the examples below.
     *
     * @example <div ba-if="{{1 === 1}}"><h1>Hi</h1><div>
     * // Evaluated to <div><h1>Hi</h1></div>
     *
     * @example <div ba-if="{{1 === 2}}"></h1>Hi</h1></div>
     * // Evaluated to <div></div>
     */
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(node, args, value) {
                inherited.constructor.apply(this, arguments);
                if (!value)
                    node.deactivate();
            },

            _apply: function(value) {
                inherited._apply.call(this, value);
                if (value)
                    this._node.activate();
                else
                    this._node.deactivate();
            }

        };
    });
    Cls.register("ba-if");
    return Cls;
});
Scoped.define("module:Partials.IgnorePartial", ["module:Handlers.Partial"], function(Partial, scoped) {
    /**
     * @name ba-ignore
     *
     * @description
     * The ba-ignore partial instructs the BetaJS Dynamics process to not process
     * anything of the inner Html within the given element implementing the
     * ba-ignore partial. The ba-ignore partial is often used to stop the
     * processing of an inline script tag.
     *
     * @example <div ba-attrs="{{{test: 'hi'}}}"><p ba-ignore>{{test}}</p></div>
     * // Renders <div ...><p ba-ignore>{{test}}</p></div>
     */
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(node, args, value) {
                inherited.constructor.apply(this, arguments);
                node.deactivate();
            }

        };
    });
    Cls.register("ba-ignore");
    return Cls;
});
Scoped.define("module:Partials.InnerTemplatePartial", ["module:Handlers.Partial"], function(Partial, scoped) {

    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(node, args, value) {
                inherited.constructor.apply(this, arguments);
                node._element.innerHTML = value;
            }

        };
    }, {

        meta: {
            value_hidden: true
        }

    });
    Cls.register("ba-inner-template");
    return Cls;

});
Scoped.define("module:Partials.NoScopePartial", ["module:Handlers.Partial"], function(Partial, scoped) {
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            prepareTagHandler: function(createArguments) {
                createArguments.properties = this._node.properties();
            }

        };
    });
    Cls.register("ba-noscope");
    return Cls;
});
Scoped.define("module:Partials.OnPartial", [
    "module:Handlers.Partial",
    "browser:Events"
], function(Partial, Events, scoped) {
    /**
     * @name ba-on
     *
     * @description
     * The ba-on partial executes the given expression when triggered by the
     * specified Dom event on the given Html element. For a complete list of Dom
     * events, see {@link http://www.w3schools.com/jsref/dom_obj_event.asp}
     *
     * @postfix {event} event The event triggering the expression is specified as
     * a post fix of the ba-on directive. See the examples.
     *
     * @param {expression} baOn Expression to evaluate upon the occurence of the
     * event. If within the scope of another directive, the expression can be an
     * exposed method of the parent directive (see ba-click documentation for
     * greater detail).
     *
     * @example <button ba-on:mouseover="alert('Hi')">Hi</button>
     * // Will alert('Hi') when the mouseover event occurs on the button.
     */
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(node, args, value, postfix) {
                inherited.constructor.apply(this, arguments);
                var events = this.auto_destroy(new Events());
                events.on(this._node._element, postfix.trim(), function() {
                    this._execute(value.trim());
                }, this);
            }

        };
    }, {

        manualExecute: true

    });
    Cls.register("ba-on");
    return Cls;
});
Scoped.define("module:Partials.PropPartial", [
    "module:Handlers.Partial"
], function(Partial, Events, scoped) {
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            _apply: function(value) {
                this._node.element()[this._postfix] = value;
            }
        };
    });
    Cls.register("ba-prop");
    return Cls;
});
Scoped.define("module:Partials.RadioGroupPartial", [
    "module:Handlers.Partial",
    "browser:Events"
], function(Partial, Events, scoped) {
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(node, args, value) {
                inherited.constructor.apply(this, arguments);
                var events = this.auto_destroy(new Events());
                value = value.trim();
                this._node.element().checked = this._node.element().value === this._node.properties().get(value);
                events.on(this._node.element(), "click change", function() {
                    this._node.properties().set(value, this._node.element().value);
                }, this);
                this._node.properties().on("change:" + value, function() {
                    this._node.element().checked = this._node.element().value === this._node.properties().get(value);
                }, this);
            }

        };
    });
    Cls.register("ba-radio-group");
    return Cls;
});
Scoped.define("module:Partials.RegisterPartial", ["module:Handlers.Partial"], function(Partial, scoped) {
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            bindTagHandler: function(handler) {
                handler.nameRegistry().register(handler, this._value);
            },

            unbindTagHandler: function(handler) {
                if (handler)
                    handler.nameRegistry().unregister(this._value);
            }

        };
    });
    Cls.register("ba-register");
    return Cls;
});
Scoped.define("module:Partials.RepeatElementPartial", [
    "module:Partials.RepeatPartial",
    "base:Collections.Collection",
    "base:Collections.FilteredCollection",
    "base:Objs",
    "module:Parser",
    "base:Properties.Properties",
    "browser:Dom"
], function(Partial, Collection, FilteredCollection, Objs, Parser, Properties, Dom, scoped) {
    /**
     * @name ba-repeat-element
     *
     * @description
     * Instantiate entire Html element (both element and the html is closes)
     * once for each instance in the collection.
     * Differs from ba-repeat, in that while ba-repeat instantiates just the
     * inner Html contents of the given element for each instance in the
     * collection, ba-repeat-element instantiates the Html element and the inner
     * Html contents. See examples.
     * 
     * @param {object} instance Object representing a single element in the
     * collection. Updated as collection is iterated through.
     *
     * @param {object} collection Object representing multiple elements, each of
     * which will be instantiated.
     *
     * @example <p ba-repeat-element="{{ i :: [1,2,3] }}">{{i}}</p>
     * // Evalues to <p>1</p><p>2</p><p>3</p>
     */
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(node, args, value) {
                inherited.constructor.apply(this, arguments);
                var temp = Dom.elementByTemplate(node._template);
                temp.removeAttribute("ba-repeat-element");
                this.__filteredTemplate = temp.outerHTML.trim();
                this.__alwaysReindexNewItems = true;
            },

            _activate: function() {
                this._node.element().style.display = "none";
                inherited._activate.call(this);
            },

            _iterateCollection: function(callback) {
                var a = this._collection.iterator().asArray();
                for (var i = a.length - 1; i >= 0; --i)
                    callback.call(this, a[i]);
            },

            _newItemElements: function() {
                var element = Dom.elementByTemplate(this.__filteredTemplate);
                this._node.element().parentNode.insertBefore(element, this._node.element().nextSibling);
                element["ba-handled"] = true;
                return [element];
            },

            prepareTagHandler: function(createArguments) {
                createArguments.ignoreTagHandler = true;
            }

        };
    });
    Cls.register("ba-repeat-element");
    return Cls;
});
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
                var repArgs = args[0].trim().split(".");
                this.__repeatArg = repArgs[0];
                this.__indexArg = repArgs[1];
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
                    if (self.__indexArg)
                        obj[self.__indexArg] = self._collection.getIndex(prop);
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
                if (this.__indexArg)
                    locals[this.__indexArg] = this._collection.getIndex(item);
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
Scoped.define("module:Partials.ReturnPartial", [
    "module:Handlers.Partial",
    "browser:Events"
], function(Partial, Events, scoped) {
    /**
     * @name ba-return
     *
     * @description
     * The ba-return partial allows the specification of custom behavior when the
     * `return` key is pressed.
     *
     * @param {expression} baReturn Expression to evaluate upon return key being
     * pressed. See ba-click for greater description as they are very similar.
     *
     * @example <input ba-return="processText()"></input>
     * // Calls parentDirective.processText() when return key is pressed within
     * the input field.
     */
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(node, args, value) {
                inherited.constructor.apply(this, arguments);
                var events = this.auto_destroy(new Events());
                events.on(this._node._element, "keypress", function(e) {
                    if (e.which === 13)
                        this._execute();
                }, this);
            }

        };
    }, {

        manualExecute: true

    });
    Cls.register("ba-return");
    return Cls;
});
Scoped.define("module:Partials.ShareScopePartial", ["module:Handlers.Partial"], function(Partial, scoped) {
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            bindTagHandler: function(handler) {
                handler.properties().bind("", this._value ? this._value : this._node.properties(), {
                    deep: true
                });
            }

        };
    });
    Cls.register("ba-sharescope");
    return Cls;
});
Scoped.define("module:Partials.ShowPartial", ["module:Handlers.Partial"], function(Partial, scoped) {
    /**
     * @name ba-show
     *
     * @description
     * The ba-show partials controls showing the internal Html on the Dom based on
     * the truth value of the given expression.
     *
     * @param {expression} baShow Expression to evaluate for truth. If true,
     * internal html will be displayed. If false, internal html will not be
     * displayed. Expression must be wrapped in {{}} so it will be evaluated, as
     * seen below.
     *
     * @example <p ba-show="{{1 === 1}}">Hi</p>
     * // Evalues to <p>Hi</p>
     * @example <p ba-show="{{1 === 2}}">Hi</p>
     * // Evalues to <p style="display: none;">Hi</p>
     */
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(node, args, value) {
                inherited.constructor.apply(this, arguments);
                this.__oldDisplay = undefined;
                this.__readOldDisplay = false;
                this.__hidden = false;
                if (!value)
                    this.__hide();
            },

            __hide: function() {
                if (this.__hidden)
                    return;
                this.__hidden = true;
                if (!this.__readOldDisplay) {
                    this.__oldDisplay = this._node._element.style.display;
                    this.__readOldDisplay = true;
                }
                this._node._element.style.display = "none";
            },

            __show: function() {
                if (!this.__hidden)
                    return;
                this.__hidden = false;
                this._node._element.style.display = this.__oldDisplay && this.__oldDisplay !== 'none' ? this.__oldDisplay : "";
            },

            _apply: function(value) {
                if (value)
                    this.__show();
                else
                    this.__hide();
            }

        };
    });
    Cls.register("ba-show");
    return Cls;
});
Scoped.define("module:Partials.StylesPartial", ["module:Handlers.Partial"], function(Partial, scoped) {
    var Cls = Partial.extend({
        scoped: scoped
    }, {

        _apply: function(value) {
            for (var key in value)
                this._node._element.style[key] = value[key];
        }

    });
    Cls.register("ba-styles");
    return Cls;
});
Scoped.define("module:Partials.TapPartial", [
    "module:Handlers.Partial",
    "browser:Info",
    "browser:Events",
    "base:Time",
    "base:Async"
], function(Partial, Info, Events, Time, Async, scoped) {
    /**
     * @name ba-tap
     *
     * @description
     * The ba-tap partial allows the specification of custom on tap behavior. Tap
     * is particularly useful for handling mobile events.
     *
     * @param {expression} baTap Expression to evaluate upon tap. See ba-click
     * documentation for more details as they are very similar.
     *
     * @example <button ba-tap="someMethod()">Tap</button>
     * // Calls parentDirective.call("someMethod") on tap.
     */
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(node, args, value, postfix) {
                inherited.constructor.apply(this, arguments);
                var events = this.auto_destroy(new Events());
                if (!Info.isMobile()) {
                    events.on(this._node._element, "click", function(e) {
                        e.stopPropagation();
                        this.executeAction();
                    }, this);
                    return;
                }
                /*
                    This code prevents two issues with tapping on mobile devices
                        - after touchstart, click is being fired and might execute subsequent things
                            workaround: if delta between last tap and click is too small, discard
                        - sometimes click is fired but not touchstart
                            workaround: if delta between last tap and click is sufficiently large, execute
                 */
                var touch = postfix ? "touch" + postfix.trim() : "touchstart";
                var lastTap = 0;
                events.on(this._node._element, "click " + touch, function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    var delta = Time.now() - lastTap;
                    if (delta < 100)
                        return;
                    Async.eventually(function() {
                        this.executeAction();
                    }, this);
                    lastTap = Time.now();
                }, this);
            },

            executeAction: function() {
                this._execute();
            }

        };
    }, {

        manualExecute: true

    });
    Cls.register("ba-tap");
    return Cls;
});
Scoped.define("module:Partials.TemplatePartial", ["module:Handlers.Partial"], function(Partial, scoped) {

    var Cls = Partial.extend({
        scoped: scoped
    }, {

        bindTagHandler: function(handler) {
            if (this._value)
                handler.template = this._value;
        }

    }, {

        meta: {
            requires_tag_handler: true,
            value_hidden: true
        }

    });
    Cls.register("ba-template");
    return Cls;

});
Scoped.define("module:Partials.TemplateUrlPartial", ["module:Handlers.Partial", "browser:Loader"], function(Partial, Loader, scoped) {

    /**
     * @name ba-template-url
     *
     * @description
     * Specify the template url for internal html.
     *
     * @param {string} templateUrl The template url.
     *
     * @example <div ba-template-url="my-template.html"></div>
     * // Evaluates to <div ...>CONTENTS OF MY-TEMPLATE.HTML</div>
     */
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(node, args, value) {
                inherited.constructor.apply(this, arguments);
                node._expandChildren = false;
                node.element().innerHTML = "";
                Loader.loadHtml(value, function(template) {
                    node.element().innerHTML = template;
                    var children = node.element().childNodes;
                    for (var i = 0; i < children.length; ++i)
                        node._registerChild(children[i]);
                }, this);
            }

        };
    });
    Cls.register("ba-template-url");
    return Cls;

});
Scoped.define("module:Partials.TogglePartial", ["module:Handlers.Partial"], function(Partial, scoped) {
    var mapping = {
        readonly: "readOnly",
        playsinline: "playsInline"
    };

    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(node, args, value, postfix) {
                inherited.constructor.apply(this, arguments);
                this._apply(value);
            },

            _apply: function(value) {
                this._node.element()[mapping[this._postfix] || this._postfix] = value ? this._postfix : null;
            }

        };
    });
    Cls.register("ba-toggle");
    return Cls;
});
Scoped.define("module:Partials.WeakIfPartial", ["module:Partials.ShowPartial"], function(Partial, scoped) {
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(node, args, value) {
                inherited.constructor.apply(this, arguments);
                if (!value)
                    node.deactivate();
            },

            _apply: function(value) {
                inherited._apply.call(this, value);
                if (value)
                    this._node.activate();
            }

        };
    });
    Cls.register("ba-weak-if");
    return Cls;
});
}).call(Scoped);