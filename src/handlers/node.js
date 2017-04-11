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

                this._mesh = new Mesh([window, this.properties(), this._locals, this._handler.functions, this._handler._mesh_extend], this._handler, {
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

            __executeDyn: function(dyn) {
                return Types.is_object(dyn) ? this._mesh.call(dyn.dependencies, dyn.func) : dyn;
            },

            __tagValue: function() {
                if (!this._dynTag)
                    return this._tag;
                return this.__executeDyn(this._dynTag);
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
                Objs.iter(this._attrs, function(attr) {
                    attr.prepareTagHandler(createArguments);
                }, this);
                if (createArguments.ignoreTagHandler)
                    return;
                if (createArguments.cacheable)
                    this._tagHandler = Registries.handlerCache.resume(tagv, this._element, this._handler);
                if (!this._tagHandler)
                    this._tagHandler = Registries.handler.create(tagv, createArguments);
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
                    var converted = Dom.entitiesToUnicode(value === null ? "" : value);
                    if ("textContent" in this._element)
                        this._element.textContent = converted;
                    if ("innerText" in this._element)
                        this._element.innerText = converted;
                    if (Info.isInternetExplorer() && Info.internetExplorerVersion() < 9 && ("data" in this._element))
                        this._element.data = converted;
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