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
            },

            handle_call_exception: function(name, args, e) {
                Registries.throwException(new DynamicsCallException(this.cls.classname, name, args, e));
                return null;
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