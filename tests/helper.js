
BetaJS.Browser.Dom.ready(function () {
	var elements = document.getElementsByTagName("democase");
	var elems = [];
	for (var i = 0; i < elements.length; ++i)
        elems.push(elements[i]);
    elems.forEach(function (democase) {
		democase.style.display = "none";
		var src = democase.attributes.src.value;
		src += (src.indexOf("?") >= 0 ? "&" : "?") + "rev=" + BetaJS.Time.now();
		var title = BetaJS.Strings.splitLast(BetaJS.Strings.splitFirst(src, ".html").head, "/").tail.replace(/_/g, " ");
		QUnit.test("demotest : " + title, function (assert) {
			var done = assert.async();
			BetaJS.Browser.Loader.loadHtml(src, function (content) {
				var parsed = BetaJS.Browser.Dom.elementsByTemplate(content);
				var template = "";
				var code = "";
				parsed.forEach(function (elem) {
					if (elem.id == "test")
						document.querySelector("#qunit-fixture").innerHTML = "<div id='test'>" + elem.innerHTML + "</div>";
					if (elem.tagName == "SCRIPT")
						code = elem.innerHTML;
				});
				/*jslint evil: true */
				var f = new Function ("assert", code + "try {test(assert);} catch (e) { assert.ok(false, e.toString()); }");
				var windowKeys = BetaJS.Objs.clone(window, 1);
				f(assert);
				BetaJS.Objs.iter(window, function (value, key) {
					if (!(key in windowKeys)) {
						try {
                            delete window[key];
                        } catch (e) {
							window[key] = null;
						}
                    }
				});
				done();
			});
		});
	});
});
