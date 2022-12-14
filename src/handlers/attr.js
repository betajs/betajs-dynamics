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
                            var oldCurrElement = this._node._locals.currElement;
                            this._node._locals.domEvent = arguments;
                            this._node._locals.currElement = this._element;
                            this._node.__executeDyn(this._dyn);
                            if (this._node && this._node._locals) {
                                this._node._locals.domEvent = oldDomEvent;
                                this._node._locals.currElement = oldCurrElement;
                            }
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