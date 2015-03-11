$(document).ready(function () {
	$("democase").each(function () {
		var democase = $(this);
		democase.css("display", "none");
		var src = democase.attr("src");
		src += (src.indexOf("?") >= 0 ? "&" : "?") + "rev=" + BetaJS.Time.now();
		var title = BetaJS.Strings.splitLast(BetaJS.Strings.splitFirst(src, ".html").head, "/").tail.replace(/_/g, " ");
		test(title, function () {
			stop();
			BetaJS.Browser.Loader.loadHtml(src, function (content) {
				var parsed = $(content);
				var template = "";
				var code = "";
				parsed.each(function () {
					if (this.tagName == "TEST")
						$("#qunit-fixture").html("<test>" + $(this).html() + "</test>");
					if (this.tagName == "SCRIPT")
						code = $(this).html();
				});
				var f = new Function (code + "try {test();} catch (e) { QUnit.equal('Exception', e.toString()); }");
				var windowKeys = BetaJS.Objs.clone(window, 1);
				f();
				BetaJS.Objs.iter(window, function (value, key) {
					if (!(key in windowKeys))
						delete window[key];
				});
				start();
			});
		})
	});
});
