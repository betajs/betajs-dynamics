Scoped.define("module:Handlers.Node", [
	    "base:Class",
	    "base:Events.EventsMixin",
	    "base:Ids",
	    "module:Parser",
	    "jquery:",
	    "module:Data.Mesh",
	    "base:Objs",
	    "base:Types",
	    "module:Registries"
	], function (Class, EventsMixin, Ids, Parser, $, Mesh, Objs, Types, Registries, scoped) {
	var Cls;
	Cls = Class.extend({scoped: scoped}, [EventsMixin, function (inherited) {
		return {
			
			constructor: function (handler, parent, element, locals) {
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
				
				this._$element = $(element);
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
				
				this._mesh = new Mesh([this.properties(), this._locals, this._handler.functions], this._handler);
								
				if (element.attributes) {
					for (var i = 0; i < element.attributes.length; ++i)
						this.__initializeAttr(element.attributes[i]);
				}
				this._locked = false;
				this._active = !this._active;
				if (this._active)
					this.deactivate();
				else
					this.activate();
			},
			
			destroy: function () {
				Objs.iter(this._attrs, function (attr) {
					if (attr.partial)
						attr.partial.destroy();
					if (attr.dyn)
						this.__dynOff(attr.dyn);
				}, this);
				this._removeChildren();
				if (this._tagHandler)
					this._tagHandler.destroy();
				if (this._dyn)
					this.properties().off(null, null, this._dyn);
				if (this._parent)
					delete this._parent._children[Ids.objectId(this)];
				this._mesh.destroy();
				inherited.destroy.call(this);
			},
			
			element: function () {
				return this._element;
			},
			
			$element: function () {
				return this._$element;
			},
		
			__dynOff: function (dyn) {
				this._mesh.unwatch(dyn.dependencies, dyn);
			},
			
			__dynOn: function (dyn, cb) {
				var self = this;
				this._mesh.watch(dyn.dependencies, function () {
					cb.apply(self);
				}, this);
			},
			
			__initializeAttr: function (attr) {
				var obj = {
					name: attr.name,
					value: attr.value,
					domAttr: attr,
					dyn: Parser.parseText(attr.value)
				};
				this._attrs[attr.name] = obj;
				this.__updateAttr(obj);
				if (Registries.partial.get(obj.name))
					obj.partial = Registries.partial.create(obj.name, this, obj.dyn ? obj.dyn.args : {}, obj.value);
				if (obj.dyn) {
					this.__dynOn(obj.dyn, function () {
						this.__updateAttr(obj);
					});
					var self = this;
					if (obj.dyn.bidirectional && obj.name == "value") {
						this._$element.on("change keyup keypress keydown blur focus update", function () {
							self._mesh.write(obj.dyn.variable, self._element.value);
						});
					}
				}
			},
			
			__executeDyn: function (dyn) {
				return Types.is_object(dyn) ? this._mesh.call(dyn.dependencies, dyn.func) : dyn;
			},
			
			__updateAttr: function (attr) {
				var value = attr.dyn ? this.__executeDyn(attr.dyn) : attr.value;
				if ((value != attr.value || Types.is_array(value)) && !(!value && !attr.value)) {
					var old = attr.value;
					attr.value = value;
					attr.domAttr.value = value;
					if (attr.partial)
						attr.partial.change(value, old);
					if (attr.name == "value") {
						this._element.value = value;
					}
					this.trigger("change-attr:" + attr.name, value, old);
				}
			},
			
			__tagValue: function () {
				if (!this._dynTag)
					return this._tag;
				return this.__executeDyn(this._dynTag);
			},
			
			__unregisterTagHandler: function () {
				if (this._tagHandler) {
					this.off(null, null, this._tagHandler);
					this._tagHandler.destroy();
					this._tagHandler = null;
				}
			},
			
			__registerTagHandler: function () {
				this.__unregisterTagHandler();
				var tagv = this.__tagValue();
				if (!Registries.handler.get(tagv))
					return false;
				this._tagHandler = Registries.handler.create(tagv, {
					parentElement: this._$element.get(0),
					parentHandler: this._handler,
					autobind: false,
					tagName: tagv
				});
				this._$element.append(this._tagHandler.element());
				Objs.iter(this._attrs, function (attr, key) {
					if (!attr.partial && key.indexOf("ba-") === 0) {
						var innerKey = key.substring("ba-".length);
						this._tagHandler.properties().set(innerKey, attr.value);
						if (attr.dyn) {
							var self = this;
							this.on("change-attr:" + key, function (value) {
								self._tagHandler.properties().set(innerKey, value);
							}, this._tagHandler);
							if (attr.dyn.bidirectional) {
								//var prop = this.__propGet(attr.dyn.variable);
								this._tagHandler.properties().on("change:" + innerKey, function (value) {
									//prop.props.set(prop.key, value);
									self._mesh.write(attr.dyn.variable, value);
								}, this);							
							}
						}
					}
				}, this);
				this._tagHandler.activate();
				return true;
			},
			
			activate: function () {
				if (this._locked || this._active)
					return;
				this._locked = true;
				this._active = true;
				if (this._dynTag) {
					this.__dynOn(this._dynTag, function () {
						this.__registerTagHandler();
					});
				}
				var registered = this.__registerTagHandler(); 
		        if (!registered && this._expandChildren) {
		        	if (this._restoreInnerTemplate)
		        		this._$element.html(this._innerTemplate);
		        	this._touchedInner = true;
					if (this._element.nodeType == this._element.TEXT_NODE) {
						this._dyn = Parser.parseText(this._element.textContent);
						if (this._dyn) {
							this.__dynOn(this._dyn, function () {
								this.__updateDyn();
							});
						}
					}
					this.__updateDyn(true);
					for (var i = 0; i < this._element.childNodes.length; ++i)
						this._registerChild(this._element.childNodes[i]);
				}
				this._$element.css("display", "");
				for (var key in this._attrs) {
					if (this._attrs[key].partial) 
						this._attrs[key].partial.activate();
				}
				this._locked = false;
			},
			
			__updateDyn: function (force) {
				if (!this._dyn)
					return;
				var value = this.__executeDyn(this._dyn);
				if (force || value != this._dyn.value) {
					this._dyn.value = value;
					this._element.textContent = value;
				}
			},
				
			_registerChild: function (element, locals) {
				return new Cls(this._handler, this, element, Objs.extend(Objs.clone(this._locals, 1), locals));
			}, 
			
			_removeChildren: function () {
				Objs.iter(this._children, function (child) {
					child.destroy();
				});
			},
			
			deactivate: function () {
				if (!this._active)
					return;
				this._active = false;
				if (this._locked)
					return;
				this._locked = true;
				for (var key in this._attrs) {
					if (this._attrs[key].partial)
						this._attrs[key].partial.deactivate();
				}
				this._removeChildren();
				if (this._dynTag)
					this.__dynOff(this._dynTag);
				this.__unregisterTagHandler();
				if (this._dyn) {
					this.__dynOff(this._dyn);
					this._dyn = null;
				}
				if (this._touchedInner)
					this._$element.html("");
				this._restoreInnerTemplate = true;
				this._locked = false;
			},	
				
			properties: function () {
				return this._handler.properties();
			}
		};
	}]);
	return Cls;
});