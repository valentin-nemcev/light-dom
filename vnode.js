class VTextNode {
    constructor({text}) {
        this.text = String(text);
    }

    toJSON() {
        return {text: this.text};
    }
}

class VNode {
    constructor({tagName, key, children, ...options}) {
        this.tagName = tagName.toLowerCase();
        this.data = options;

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
        ['tagName', 'key', 'data'].forEach(
            k => { if (k in this) json[k] = this[k]; }
        );
        json.children = this.children.map(c => c.toJSON());
        return json;
    }
}

export default function vnode(params) {
    return new VNode(params);
}
