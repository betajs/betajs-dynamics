Scoped.define("module:Registries", [
    "base:Classes.ClassRegistry",
    "base:Exceptions.AsyncExceptionThrower",
    "browser:Dom"
], function(ClassRegistry, AsyncExceptionThrower, Dom) {
    return {

        handler: new ClassRegistry({}, true),
        partial: new ClassRegistry({}, true),
        prefixes: {
            "ba": true
        },

        templates: {

            cache: {},

            create: function(template) {
                template = template.trim();
                var cached = this.cache[template];
                if (!cached) {
                    if (template.indexOf("<") === 0)
                        cached = Dom.elementsByTemplate(template);
                    else
                        cached = [document.createTextNode(template)];
                    this.cache[template] = cached;
                }
                return cached.map(function(element) {
                    return element.cloneNode(true);
                });
            }

        },

        throwException: function(e) {
            try {
                if (!this.exceptionThrower)
                    this.exceptionThrower = new AsyncExceptionThrower();
                this.exceptionThrower.throwException(e);
            } catch (ex) {}
        },

        handlerCache: {

            cache: {},
            cacheDom: null,

            suspend: function(handler, element) {
                element = Dom.unbox(element);
                if (!this.cacheDom) {
                    this.cacheDom = document.createElement("div");
                    this.cacheDom.setAttribute("ba-ignore", "");
                    this.cacheDom.style.display = "none";
                    document.body.appendChild(this.cacheDom);
                }
                var name = handler.data("tagname");
                this.cache[name] = this.cache[name] || [];
                var children = [];
                for (var i = 0; i < element.children.length; ++i)
                    children.push(element.children[i]);
                this.cache[name].push({
                    handler: handler,
                    elements: children
                });
                children.forEach(function(child) {
                    this.cacheDom.appendChild(child);
                }, this);
            },

            resume: function(name, element, parentHandler) {
                element = Dom.unbox(element);
                if (!this.cache[name] || this.cache[name].length === 0)
                    return null;
                var record = this.cache[name].shift();
                element.innerHTML = "";
                record.elements.forEach(function(child) {
                    element.appendChild(child);
                });
                record.handler._handlerInitialize({
                    parentHandler: parentHandler,
                    parentElement: element
                });
                return record.handler;
            }

        }

    };
});