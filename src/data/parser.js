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
                this.__functions[code] = new Function("obj", "with (obj) { return " + code + "; }");
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
                var c = code;
                if (c.charAt(0) == "=") {
                    bidirectional = true;
                    c = c.substring(1);
                } else if (c.charAt(0) == "-") {
                    html = true;
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
                    html: html,
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