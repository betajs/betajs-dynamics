$(document).ready(function () {
	$("template").each(function () {
		var template = $(this);
		template.css("display", "none");
		BetaJS.Browser.Loader.loadHtml(template.attr("src"), function (content) {
			template.html(content);
		});
	});
});