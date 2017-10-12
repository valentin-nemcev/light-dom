const noop = () => {};

class VNodeBase {
    get isVNode() { return true; }

    updateBy(newNode, seqNo) {
        newNode.setElement(this.elm);
        this._wasUpdated = true;
        this._updateSeqNo(seqNo);
        newNode._updateSeqNo(seqNo);
        return this;
    }

    afterUpdateBy() { return this; }

    canBeUpdatedBy(node) {
        return !node._wasUpdated && node.elm == null;
    }

    reused(seqNo) {
        if (this._wasUpdated)
            throw new Error("Can't reuse updated VNode");
        this._updateSeqNo(seqNo);
        return this;
    }

    wasUpdated(seqNo) {
        return this._seqNo != null && this._seqNo >= seqNo;
    }

    _updateSeqNo(seqNo) {
        if (this.wasUpdated(seqNo))
            throw new Error("Can't patch same VNode more than once");
        this._seqNo = seqNo;
    }

    afterAttach() { return this; }

    beforeDetach() { return this; }

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

    constructor({tagName, key, children, hooks, ...options}) {
        super();

        this.tagName = tagName.toLowerCase();
        Object.assign(this, options);

        this._setKey(key);

        this.children = [];
        this._normalizeChildren(children);

        this._childrenMap = new Map();
        this.children.forEach(child => {
            this._childrenMap.set(child, true);
        });
        if (this._childrenMap.size < this.children.length) {
            throw new Error('Child VNode used more than once');
        }

        this._hooks = {
            afterUpdate: noop,
            afterAttach: noop,
            beforeDetach: noop,
            ...hooks,
        };
    }

    _setKey(key) {
        if (key !== undefined) {
            if (key === null) throw new Error("Can't use null as key");
            this.key = key;
        }
    }

    ensureKey(key) {
        if (key != null && this.key == null) this._setKey(key);
        return this;
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

    afterUpdateBy(newNode) {
        super.afterUpdateBy(newNode);
        this._hooks.afterUpdate.call(null, this, newNode);
        return this;
    }

    afterAttach() {
        super.afterAttach(...arguments);
        this._hooks.afterAttach.call(null, this.elm);
        return this;
    }

    beforeDetach(replacingElm) {
        super.beforeDetach(...arguments);
        this._hooks.beforeDetach.call(null, this.elm, replacingElm);
        return this;
    }

    _normalizeChildren(children) {
        for (const child of Array.isArray(children) ? children : [children]) {
            if (Array.isArray(child)) {
                this._normalizeChildren(child);
            } else if (child != null) {
                if (typeof child === 'object' && !child.isVNode)
                    throw new Error('Children should be primitives or VNodes');
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
