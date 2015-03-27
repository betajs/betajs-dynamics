Scoped.define("module:Parser", ["base:Types", "base:Objs", "base:JavaScript"], function (Types, Objs, JavaScript) {
	return {		
		
		parseText: function (text) {
			if (!text)
				return null;
			var chunks = [];
			while (text) {
				var i = text.indexOf("{{");
				var dynamic = null;
				if (i === 0) {
					i = text.indexOf("}}");
					while (i + 2 < text.length && text.charAt(i+2) == "}")
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
			Objs.iter(chunks, function (chunk) {
				if (!Types.is_string(chunk)) {
					Objs.iter(chunk.dependencies, function (dep) {
						dependencies[dep] = true;
					});
				}
			});
			return {
				func: function (obj) {
					var s = null;
					Objs.iter(chunks, function (chunk) {
						var result = Types.is_string(chunk) ? chunk : chunk.func(obj);
						s = s === null ? result : (s + result);
					});
					return s;
				},
				dependencies: Objs.keys(dependencies)
			};
		},
		
		parseCode: function (code) {
			var bidirectional = false;
			if (code.charAt(0) == "=") {
				bidirectional = true;
				code = code.substring(1);
			}
			var i = code.indexOf("::");
			var args = null;
			if (i >= 0) {
				args = code.substring(0, i).trim();
				code = code.substring(i + 2);
			}
			return {
				bidirectional: bidirectional,
				args: args,
				variable: bidirectional ? code : null,
				/*jslint evil: true */
				func: new Function ("obj", "with (obj) { return " + code + "; }"),
				dependencies: Objs.keys(Objs.objectify(JavaScript.extractIdentifiers(code, true)))
			};
		}
	
	};
});