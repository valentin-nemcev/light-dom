function isEmptyObject(object) {
    for (const key in object) return false;
    return true;
}

function _normalizeChildren(children, normalized) {
    for (const child of children) {
        if (Array.isArray(child)) {
            _normalizeChildren(child, normalized);
        } else if (child != null) {
            normalized.push(
                typeof child === 'object' ? child : {text: String(child)}
            );
        } // else skip
    }
}

export default function h({
    tagName = '',
    selector = '',
    key,
    children,
    ...options
}) {
    const vnode = {
        sel: tagName + selector,
    };

    if (!isEmptyObject(options)) vnode.data = options;
    if (key !== undefined) vnode.key = key;

    if (Array.isArray(children)) {
        vnode.children = [];
        _normalizeChildren(children, vnode.children);
    } else if (children != null && typeof children === 'object') {
        vnode.children = [children];
    } else if (children == null) {
        vnode.text = '';
    } else {
        vnode.text = String(children);
    }
    return vnode;
}
