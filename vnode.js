import assert from 'assert';

class VNodeBase {
    constructor() {
        this.isVNode = true;
    }

    setElement(element) {
        assert(this.elm == null);
        this.elm = element;
        return this;
    }

}

class VTextNode extends VNodeBase {
    constructor({text}) {
        super();
        this.text = String(text);
    }

    createEmptyCopy() {
        return new VTextNode({text: ''});
    }

    toJSON() {
        return {text: this.text};
    }
}

class VNode extends VNodeBase {
    constructor({tagName, key, children, ...options}) {
        super();

        this.tagName = tagName.toLowerCase();
        Object.assign(this, options);

        if (key !== undefined) {
            if (key === null)
                throw new Error("Can't use null as key");
            if (typeof key !== 'number' && typeof key !== 'string')
                throw new Error(`Can't use ${typeof key} as key`);
            this.key = key;
        }

        this.children = [];
        this._normalizeChildren(children);

        this.childrenMap = new Map();
        this.children.forEach(child => {
            this.childrenMap.set(child, true);
        });
    }

    createEmptyCopy() {
        return new VNode({tagName: this.tagName});
    }

    _normalizeChildren(children) {
        for (const child of Array.isArray(children) ? children : [children]) {
            if (Array.isArray(child)) {
                this._normalizeChildren(child);
            } else if (child != null) {
                this.children.push(
                    typeof child === 'object'
                        ? child
                        : new VTextNode({text: child})
                );
            } // else skip
        }
    }

    toJSON() {
        const json = {...this};
        ['childrenMap', 'isVNode'].forEach(
            k => delete json[k]
        );
        json.children = this.children.map(c => c.toJSON());
        return json;
    }
}

export default function vnode(params) {
    return params.tagName != null ? new VNode(params) : new VTextNode(params);
}

export function fromElement(elm) {
    if (elm instanceof window.HTMLElement) {
        return new VNode({tagName: elm.tagName}).setElement(elm);
    } else if (elm instanceof window.Text) {
        return new VTextNode({text: elm.nodeValue}).setElement(elm);
    }
}
