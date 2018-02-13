import {inspect} from 'util';

class VNodeBase {
    get isVNode() { return true; }

    updateBy(newNode, seqNo) {
        newNode.setElement(this.elm);
        this._wasUpdated = true;
        this._updateSeqNo(seqNo);
        newNode._updateSeqNo(seqNo);
        return this;
    }

    afterUpdateBy(newNode) {
        newNode.afterUpdate && newNode.afterUpdate(this);
        return this;
    }

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
        super(...arguments);
        this.text = String(text);
    }

    clone() {
        return new VTextNode({text: this.text});
    }

    createPlaceholder() {
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

    constructor({
        tagName,
        key,
        children,
        hooks = {},
        isPlaceholder,
        ...options}
    ) {
        super(...arguments);
        this._isPlaceholder = isPlaceholder;

        this.tagName = tagName.toLowerCase();
        Object.assign(this, options);

        this._setKey(key);

        this._hooks = {
            afterUpdate: hooks.afterUpdate,
            afterAttach: hooks.afterAttach,
            beforeDetach: hooks.beforeDetach,
        };
        this._hasNestedHooks = {
            afterAttach: !!hooks.afterAttach,
            beforeDetach: !!hooks.beforeDetach,
        };
        this._hookSeqNos = {};

        this.children = [];
        this._normalizeChildren(children);

        this._childrenMap = new Map();
        this.children.forEach(child => {
            this._childrenMap.set(child, true);
            ['afterAttach', 'beforeDetach'].forEach(hook => {
                this._hasNestedHooks[hook] = this._hasNestedHooks[hook] ||
                    (child._hasNestedHooks || {})[hook];
            });
        });
        if (this._childrenMap.size < this.children.length) {
            throw new Error('Child VNode used more than once');
        }
    }

    clone() {
        return new VNode({
            ...this._getOptions(),
            children: this.children.map(c => c.clone()),
            hooks: this._hooks,
        });
    }

    _getOptions() {
        const options = {};
        for (const key in this) {
            if (key[0] === '_' || key === 'children') continue;
            options[key] = this[key];
        }
        return options;
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

    createPlaceholder() {
        return new VNode({
            tagName: this.tagName,
            key: this.key,
            isPlaceholder: true,
        });
    }

    canBeUpdatedBy(node) {
        return super.canBeUpdatedBy(node) && node.isElementNode
            && this.tagName === node.tagName
            && this.key === node.key;
    }

    afterUpdateBy(newNode) {
        this._isPlaceholder = false;
        super.afterUpdateBy(newNode);
    }

    afterUpdate(oldNode) {
        if (this._hooks.afterUpdate)
            this._hooks.afterUpdate.call(null, this, oldNode);
        return this;
    }

    _callHooks(hook, {nested, ...args}, seqNo) {
        // Run hook only once per patch operatin
        if (this._hookSeqNos[hook] >= seqNo) return;
        this._hookSeqNos[hook] = seqNo;

        if (this._hooks[hook])
            this._hooks[hook].call(null, this.elm, {nested, ...args});
        this.children.forEach(c => {
            if ((c._hasNestedHooks || {})[hook])
                c._callHooks(hook, {nested: true}, seqNo);
        });
    }

    afterAttach(parentNode) {
        super.afterAttach(...arguments);
        this._callHooks(
            'afterAttach',
            {nested: !!(parentNode || {})._isPlaceholder},
            this._seqNo
        );
        return this;
    }

    beforeDetach(replacedWithElm) {
        super.beforeDetach(...arguments);
        this._callHooks(
            'beforeDetach',
            {replacedWithElm, nested: false},
            this._seqNo
        );
        return this;
    }

    _normalizeChildren(children) {
        for (const child of Array.isArray(children) ? children : [children]) {
            if (child == null)
                continue;
            else if (Array.isArray(child))
                this._normalizeChildren(child);
            else if (typeof child === 'object' && child.isVNode)
                this.children.push(child);
            else if (typeof child === 'object' && !child.isVNode)
                this.children.push(new VTextNode({text: inspect(child)}));
            else
                this.children.push(new VTextNode({text: child}));
        }
    }

    toJSON() {
        const json = this._getOptions();
        json.children = this.children.map(c => c.toJSON());
        return json;
    }
}

export default function vnode(params) {
    return params.tagName != null ? new VNode(params) : new VTextNode(params);
}

export function fromElement(elm) {
    if (elm instanceof window.HTMLElement) {
        return new VNode({tagName: elm.tagName});
    } else if (elm instanceof window.Text) {
        return new VTextNode({text: elm.nodeValue});
    }
}
