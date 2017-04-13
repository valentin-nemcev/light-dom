import tagsProperties from './tagsProperties.json';
import vnode from './vnode';

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

function setClass(classObj, name, value) {
    name && name.split(' ').forEach(n => (classObj[n] = classObj[n] || value));
}


function normalizeClass(className = [], classToggle = {}) {
    const classObj = {};
    Object.keys(classToggle)
        .forEach(c => setClass(classObj, c, !!classToggle[c]));
    className.forEach(c => setClass(classObj, c, true));
    return classObj;
}

function isEmptyObject(object) {
    for (const key in object) return false;
    return true;
}


export default function h({
    tagName,
    selector,
    className,
    classToggle,
    ...options
}) {
    if (selector !== undefined) throw new Error('Selector is deprecated');

    const [props, optionsSansProps] = extractProperties(tagName, options);
    options = optionsSansProps;
    if (!isEmptyObject(props)) {
        options.props =
            Object.assign(props, optionsSansProps.props);
    }

    const classObj = normalizeClass(className, classToggle);
    if (!isEmptyObject(classObj)) {
        if (options.class == null) options.class = {};
        Object.assign(options.class, classObj);
    }

    return vnode({tagName, ...options});
}

for (const tagName in tagsProperties) {
    h[tagName] = function (options) {
        return h({...options, tagName});
    };
}
