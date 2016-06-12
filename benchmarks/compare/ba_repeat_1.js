(function () {
	
	window.f = function (Dynamics) {
		$("fixture").html('<div ba-repeat="{{item::list}}"><ba-inner ba-item="{{item}}"></ba-inner></div>');
		var list = [];
		for (var i = 0; i < 1000; ++i)
			list.push({foobar: "Item " + i});
		Dynamics.Dynamic.extend(null, {
			template: "<p>{{item.foobar}}</p>"
		}).register("ba-inner");
		var mainDynamic = new Dynamics.Dynamic({
			element: $("fixture").get(0),
			attrs: {
				list: list
			}
		});
		mainDynamic.activate();
		mainDynamic.destroy();
	};
	
	suite("be-repeat-1", {
	}, function() {
		
		bench("Old Dynamics", function () {
			f(DynamicsOld);
		});
		
		bench("New Dynamics", function () {
			f(BetaJS.Dynamics);
		});
	
	});

}).call(this);