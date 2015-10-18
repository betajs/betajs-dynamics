benchmark({
	name: "demotest",
	setup: function () {
		var items = [];
        for (var i = 0; i < 100; ++i)
            items.push({title: "Title " + i});
        BetaJS.Dynamics.Dynamic.extend(null, {
            template: '<button>{{title}}</button>',
        }).register("ba-inner");
        BetaJS.Dynamics.Dynamic.extend(null, {
            template: '<div ba-repeat="{{item::items}}"><ba-inner ba-title="{{item.title}}"></ba-inner></div>',
            collections: {
                items: items
            }
        }).register("ba-outer");
	},
	test: function () {
        $("fixture").html("<ba-outer></ba-outer>");
        var dynamic = new BetaJS.Dynamics.Dynamic({ element: $("fixture").get(0) });
        dynamic.activate();
        dynamic.destroy();
        $("fixture").html("");
	}
});
