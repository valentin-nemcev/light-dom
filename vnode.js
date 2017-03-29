function normalizeChildren(children, normalized) {
    for (const child of children) {
        if (Array.isArray(child)) {
            normalizeChildren(child, normalized);
        } else if (child != null) {
            normalized.push(
                typeof child === 'object' ? child : {text: String(child)}
            );
        } // else skip
    }
}

export default function vnode({tagName, key, children, ...options}) {
    const vnode = {
        tagName: tagName.toLowerCase(),
        data: options,
    };

    if (key !== undefined) {
        if (key === null)
            throw new Error("Can't use null as key");
        if (typeof key !== 'number' && typeof key !== 'string')
            throw new Error(`Can't use ${typeof key} as key`);
        vnode.key = key;
    }

    if (Array.isArray(children)) {
        vnode.children = [];
        normalizeChildren(children, vnode.children);
    } else if (children != null && typeof children === 'object') {
        vnode.children = [children];
    } else if (children == null) {
        vnode.children = [];
    } else {
        vnode.children = [{text: String(children)}];
    }
    vnode.childrenMap = new Map();
    vnode.children.forEach(child => {
        vnode.childrenMap.set(child, true);
        // if (child.key != null) vnode.childrenMap.set
    });
    vnode.toJSON = function () {
        const json = {};
        ['tagName', 'key', 'data', 'children'].forEach(
            k => { if (k in this) json[k] = this[k]; }
        );
        return json;
    };
    return vnode;
}
