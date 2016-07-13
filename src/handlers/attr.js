Scoped.define("module:Handlers.Attr", [
	    "base:Class",
	    "module:Parser",
	    "jquery:",
	    "base:Types",
	    "base:Objs",
	    "base:Strings",
	    "module:Registries",
	    "browser:Dom"
	], function (Class, Parser, $, Types, Objs, Strings, Registries, Dom, scoped) {
	var Cls;
	Cls = Class.extend({scoped: scoped}, function (inherited) {
		return {
			
			constructor: function (node, attribute) {
				inherited.constructor.call(this);
				this._node = node;
				this._tagHandler = null;
				this._attrName = attribute.name;
				this._isEvent = this._attrName.indexOf("on") === 0;
				this._updatable = !this._isEvent;
				this._attrOriginalValue = attribute.value;
				this._attrValue = attribute.value;
				this._dyn = Parser.parseText(this._attrValue);
				if (this._dyn) {
					var self = this;
					node.mesh().watch(this._dyn.dependencies, function () {
						self.__updateAttr();
					}, this);
				}
				this.updateElement(node.element(), attribute);
			},
			
			destroy: function () {
				if (this._partial)
					this._partial.destroy();
				if (this._dyn)
					this._node.mesh().unwatch(this._dyn.dependencies, this);
				inherited.destroy.call(this);
			},
			
			__inputVal: function (el, value) {
				var valueKey = el.type === 'checkbox' || el.type === 'radio' ? 'checked' : 'value';
				if (arguments.length > 1) 
					el[valueKey] = value === null || value === undefined ? "" : value;
				return el[valueKey];
			},
			
			updateElement: function (element, attribute) {
				this._element = element;
				this._$element = $(element);
				attribute = attribute || element.attributes[this._attrName];
				this._attribute = attribute;
				this.__updateAttr();
				var splt = this._attrName.split(":");
				if (this._partial) {
					this._partial.destroy();
					this._partial = null;
				}
				if (Registries.partial.get(splt[0])) {
					this._partial = Registries.partial.create(splt[0], this._node, this._dyn ? this._dyn.args : {}, this._attrValue, splt[1]);
					if (this._partial.cls.meta.value_hidden)
						this._attribute.value = "";
				}
				if (this._dyn) {
					var self = this;
					if (this._dyn.bidirectional && this._attrName == "value") {
						this._$element.on("change keyup keypress keydown blur focus update", function () {
							self._node.mesh().write(self._dyn.variable, self.__inputVal(self._element));
						});
					}
					if (this._isEvent) {
						this._attribute.value = '';
						this._$element.on(this._attrName.substring(2), function () {
							// Ensures the domEvent does not continue to
							// overshadow another variable after the __executeDyn call ends.
							var oldDomEvent = self._node._locals.domEvent;
							self._node._locals.domEvent = arguments;
							self._node.__executeDyn(self._dyn);
							if (self._node && self._node._locals)
								self._node._locals.domEvent = oldDomEvent;
						});
					}
				}
			},
			
			__updateAttr: function () {
				if (!this._updatable)
					return;
				var value = this._dyn ? this._node.__executeDyn(this._dyn) : this._attrValue;
				if ((value != this._attrValue || Types.is_array(value)) && !(!value && !this._attrValue)) {
					var old = this._attrValue;
					this._attrValue = value;
					
					if (!this._partial || !this._partial.cls.meta.value_hidden) {
						var result = Dom.entitiesToUnicode(value);
						
						
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
						
						
						this._attribute.value = result;
					}
					
					if (this._partial)
						this._partial.change(value, old);
					if (this._attrName === "value" && this._element.value !== value)
						this.__inputVal(this._element, value);
					if (this._tagHandler && this._dyn && !this._partial)
						this._tagHandler.properties().set(Strings.first_after(this._attrName, "-"), value);
				}
			},

			bindTagHandler: function (handler) {
				this.unbindTagHandler();
				this._tagHandler = handler;
				if (!this._partial && Registries.prefixes[Strings.splitFirst(this._attrName, "-").head]) {
					var innerKey = Strings.first_after(this._attrName, "-");					
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
							this._tagHandler.properties().on("change:" + innerKey, function (value) {
								this._node.mesh().write(this._dyn.variable, value);
							}, this);							
						}
					}
				} else if (this._partial) {
					this._partial.bindTagHandler(handler);
				}
			},
			
			prepareTagHandler: function (createArguments) {
				if (this._partial)
					this._partial.prepareTagHandler(createArguments);
			},
			
			unbindTagHandler: function (handler) {
				if (this._partial) {
					this._partial.unbindTagHandler(handler);
				}
				if (this._tagHandler)
					this._tagHandler.properties().off(null, null, this);
				this._tagHandler = null;
			},
			
			activate: function () {
				if (this._partial) {
					if (this._partial.cls.meta.requires_tag_handler && !this._tagHandler) {
						Registries.warning(this._partial.cls.classname + " is expecting a tag handler, but no registered tag handler for " + this._node.tag() + " has been found.");
						return;
					}
					this._partial.activate();
				}
			},
			
			deactivate: function () {
				if (this._partial)
					this._partial.deactivate();
			}
			
		};
	});
	return Cls;
});
