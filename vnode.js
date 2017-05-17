class VNodeBase {
    get isVNode() { return true; }

    updatedBy(newNode) {
        newNode.setElement(this.elm);
        this._wasUpdated = true;
        return this;
    }

    canBeUpdatedBy(node) {
        return !node._wasUpdated && node.elm == null;
    }

    reused() {
        if (this._wasUpdated)
            throw new Error("Can't reuse updated VNode");
    }

    setElement(element) {
        if (this.elm != null) {
            throw new Error("Can't overwrite element");
        }
        this.elm = element;
        return this;
    }
}

class VTextNode extends VNodeBase {
    get isTextNode() { return true; }

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

    canBeUpdatedBy(node) {
        return super.canBeUpdatedBy(node) && node.isTextNode;
    }
}

class VNode extends VNodeBase {
    get isElementNode() { return true; }

    constructor({tagName, key, children, ...options}) {
        super();

        this.tagName = tagName.toLowerCase();
        Object.assign(this, options);

        if (key !== undefined) {
            if (key === null)
                throw new Error("Can't use null as key");
            this.key = key;
        }

        this.children = [];
        this._normalizeChildren(children);

        this._childrenMap = new Map();
        this.children.forEach(child => {
            this._childrenMap.set(child, true);
        });
        if (this._childrenMap.size < this.children.length) {
            throw new Error('Child VNode used more than once');
        }
    }

    hasChild(vnode) {
        return this._childrenMap.has(vnode);
    }

    createEmptyCopy() {
        return new VNode({tagName: this.tagName, key: this.key});
    }

    canBeUpdatedBy(node) {
        return super.canBeUpdatedBy(node) && node.isElementNode
            && this.tagName === node.tagName
            && this.key === node.key;
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
        const json = {};
        for (const key in this) {
            if (key[0] === '_' || key === 'children') continue;
            json[key] = this[key];
        }
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
