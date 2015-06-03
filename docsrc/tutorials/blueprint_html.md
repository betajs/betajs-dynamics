
This Blueprint is intented as a quick reference for how to integrate the most commonly
used Dynamic functionalities. On specifics how they work please refer to the individual sections.

```html

	<somedynamic>

	<-- Basics -->

		<-- Data bindings -->
		<databinding>{{attribute}}</databinding> <-- This is a unidirectional binding -->
		<databinding>{{=attribute}}</databinding> <-- This is a bidirectional binding -->

		<-- Click Events -->
		<button ba-click='some_function()'>Click me</button>
		<button ba-click='attribute = false'>Click me</button>
		<button ba-click='attribute = !attribute'>Click me</button>
		<button ba-tap='some_function()'>Click me</button> <-- Tap is for use in mobile -->

		<-- If/Show -->
		<div ba-if='{{true}}'>This DOM Element will always be loaded</div>
		<div ba-if='{{false}}'>This DOM Element will never be loaded</div>
		<div ba-if='{{attribute}}'>This DOM Element will be loaded if {{attribute}} evluates to 'true'</div>
		<div ba-if='{{attribute.subattribute}}'>This DOM Element will be loaded if {{attribute.subattribute}} evluates to 'true'</div>
		<div ba-if='{{attribute.get('property')}}'>This DOM Element will be loaded if {{attribute.get('property')}} evluates to 'true'</div>
		<div ba-if='{{attribute == 'load'}}'>This DOM Element will be loaded if {{attribute}} evluates to 'load'</div>
		<div ba-show='{{attribute}}'>This DOM Element will be displayed if {{attribute}} evluates to 'true'</div>

		<-- Classes -->
		<div ba-class='{{{
			'always' : true,
			'sometimes' : {{attribute}},
			'othertimes' : {{attribute.get('property') == 'other'}},
			'never' : false
		}}}'>Some random text</div>

		<-- Repeat -->
		<div ba-repeat="{{item :: ['1','2','3']}}">
			<div>
				<div>The html inside the ba-repeat item will be repeated</div>
				<div>The item tag will contain the value of the array (1/2/3): {{item}}</div>
			</div>
		</div>

		<-- DOM Events -->
		<div onmouseover="{{alert('You moved the mouse over this Element')}}"></div>

		<-- TODO: ba-ignore, check others -->

		<-- Cool Stuff -->
		<div class="{{attribute}}">Some random text</div>
		<ba-{{attribute}}>Some random text</ba-{{/attribute}}>
		<yourcustomtag-{{attribute}}>Some random text</yourcustomtag-{{/attribute}}>
		<{{attribute}}>This won't work, because of the way the Browser renders elements</{{/attribute}}>

	</somedynamic>

```
