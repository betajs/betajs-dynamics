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