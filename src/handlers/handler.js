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
            this.properties().set(key, value);
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

        _afterActivate: function(activeElement) {}

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

        register: function(key, registry) {
            registry = registry || Registries.partial;
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