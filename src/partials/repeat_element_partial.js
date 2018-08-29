Scoped.define("module:Partials.RepeatElementPartial", [
    "module:Partials.RepeatPartial",
    "base:Collections.Collection",
    "base:Collections.FilteredCollection",
    "base:Objs",
    "module:Parser",
    "base:Properties.Properties",
    "browser:Dom"
], function(Partial, Collection, FilteredCollection, Objs, Parser, Properties, Dom, scoped) {
    /**
     * @name ba-repeat-element
     *
     * @description
     * Instantiate entire Html element (both element and the html is closes)
     * once for each instance in the collection.
     * Differs from ba-repeat, in that while ba-repeat instantiates just the
     * inner Html contents of the given element for each instance in the
     * collection, ba-repeat-element instantiates the Html element and the inner
     * Html contents. See examples.
     * 
     * @param {object} instance Object representing a single element in the
     * collection. Updated as collection is iterated through.
     *
     * @param {object} collection Object representing multiple elements, each of
     * which will be instantiated.
     *
     * @example <p ba-repeat-element="{{ i :: [1,2,3] }}">{{i}}</p>
     * // Evalues to <p>1</p><p>2</p><p>3</p>
     */
    var Cls = Partial.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(node, args, value) {
                inherited.constructor.apply(this, arguments);
                var temp = Dom.elementByTemplate(node._template);
                temp.removeAttribute("ba-repeat-element");
                this.__filteredTemplate = temp.outerHTML.trim();
                this.__alwaysReindexNewItems = true;
            },

            _activate: function() {
                this._node.element().style.display = "none";
                inherited._activate.call(this);
            },

            _iterateCollection: function(callback) {
                var a = this._collection.iterator().asArray();
                for (var i = a.length - 1; i >= 0; --i)
                    callback.call(this, a[i]);
            },

            _newItemElements: function() {
                var element = Dom.elementByTemplate(this.__filteredTemplate);
                this._node.element().parentNode.insertBefore(element, this._node.element().nextSibling);
                element["ba-handled"] = true;
                return [element];
            },

            prepareTagHandler: function(createArguments) {
                createArguments.ignoreTagHandler = true;
            }

        };
    });
    Cls.register("ba-repeat-element");
    return Cls;
});