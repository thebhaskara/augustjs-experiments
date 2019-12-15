export class dom {

    constructor(element) {
        this.element = element || document;
    }

    matches(selector){
        return this.element.matches(selector);
    }

    getElements(selector) {
        return Array.from(this.element.querySelectorAll(selector));
    }

    static createElements(html) {
        let div = document.createElement('div');
        div.innerHTML = elements;
        return Array.from(div.children);
    }

    style(prop, value) {

        if (isPlainObject(prop)) {
            Object.keys(prop).forEach(p => dom.style(el, p, prop[p]));
            return this;
        }

        if (typeof value == 'undefined') {
            return this.element.style.getPropertyValue(prop);
        } else if (value == null) {
            this.element.style.removeProperty(prop);
        } else {
            this.element.style.setProperty(prop, value);
        }

        return this;
    }

    attr(attribute, value) {
        if (typeof value == 'undefined') {
            return this.element.getAttribute(attribute);
        } else {
            this.element.setAttribute(attribute, value);
            return this;
        }
    }

    text(text) {
        if (typeof text == 'undefined') {
            return this.element.innerText;
        } else {
            this.element.innerText = text;
        }
    }

    html(html) {
        if (typeof html == 'undefined') {
            return this.element.innerHTML;
        } else {
            this.element.innerHTML = html;
            return this;
        }
    }

    append(child) {
        this.element.appendChild(child);
        return this;
    }

    remove(child) {
        this.element.removeChild(child);
        return this;
    }

    empty() {
        while (this.element.firstChild) {
            this.element.removeChild(this.element.firstChild);
        }
    }

    event(event, callback) {
        this.element.addEventListener(event, callback);
        return () => this.element.removeEventListener(event, callback);
    }

    tag() {
        return this.element.tagName;
    }
}