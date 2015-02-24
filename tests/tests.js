$(document).ready(function () {
	$("democase").each(function () {
		var democase = $(this);
		democase.css("display", "none");
		var src = democase.attr("src");
		test(src, function () {
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
				var f = new Function (code + "test();");
				f();
				start();
			});
		})
	});
});
