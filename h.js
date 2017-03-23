import tagsProperties from './tagsProperties.json';

export function extractProperties(tagName, options) {
    const props = {};
    const restOptions = {};
    const global = tagsProperties._global;
    const element = tagsProperties[tagName] || {};
    for (const name in options) {
        const isProp = name in global || name in element;
        (isProp ? props : restOptions)[name] = options[name];
    }
    return [props, restOptions];
}

function isEmptyObject(object) {
    for (const key in object) return false;
    return true;
}

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

export function base({tagName, selector = '', key, children, ...options}) {
    const vnode = {
        tagName: tagName.toLowerCase(),
        sel: selector,
        data: options,
    };

    if (key !== undefined) {
        if (key === null)
            throw new Error(`Can't use null as key`);
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
    return vnode;
}

export default function h({tagName = '', selector = '', ...options}) {
    const [props, optionsSansProps] = extractProperties(tagName, options);
    const optionsNestingProps = optionsSansProps;
    if (!isEmptyObject(props)) {
        optionsNestingProps.props =
            Object.assign(props, optionsSansProps.props);
    }
    // optionsNestingProps.selector = tagName + selector;
    //
    if (tagName === '') tagName = selector.match(/^[^.#]+/)[0];

    return base({tagName, selector, ...optionsNestingProps});
}

for (const tagName in tagsProperties) {
    h[tagName] = function(options) {
        return h({...options, tagName});
    }
}
