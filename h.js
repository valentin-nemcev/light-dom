import tagsProperties from './tagsProperties.json';
import vnode from './vnode';

function isObject(val) {
    return typeof val === 'object' && val != null;
}

function isEmptyObject(object) {
    for (const key in object) return false;
    return true;
}

export function extractProperties(tagName, options) {
    const props = {};
    const restOptions = {};
    const defaultProps = tagsProperties[tagName] || tagsProperties._global;
    for (const name in options) {
        const isProp = name in defaultProps;
        (isProp ? props : restOptions)[name] = options[name];
    }
    return {defaultProps, props, restOptions};
}


function setClass(classObj, name, value) {
    name && name.split(' ').forEach(n => (classObj[n] = classObj[n] || value));
}

function normalizeClass(...args) {
    const classObj = {};
    args.forEach(arg => {
        if (isObject(arg)) {
            Object.keys(arg)
                .forEach(c => setClass(classObj, c, !!arg[c]));
        } else {
            setClass(classObj, arg, true);
        }
    });
    return classObj;
}

export {normalizeClass as c};

function normalizeClassArray(cls, result = {}) {
    if (!cls) return result;
    if (Array.isArray(cls))
        cls.forEach(c => normalizeClassArray(c, result));
    else if (typeof cls == 'object') {
        for (const c in cls) if (cls[c]) normalizeClassArray(c, result);
    } else
        String(cls).split(' ').forEach(c => { result[c] = true; });
    return result;
}

export function toggleClasses(classes, toggles) {
    const result = {};
    for (const t in toggles) {
        if (t in classes) result[classes[t]] = toggles[t];
    }
    return result;
}


export default function h({
    tagName,
    class: classes,
    ...options
}) {
    const {defaultProps, props, restOptions} =
        extractProperties(tagName, options);
    options = {...restOptions, defaultProps};
    if (!isEmptyObject(props)) {
        options.props = Object.assign(props, restOptions.props);
    }

    const classObj = normalizeClassArray(classes);
    if (!isEmptyObject(classObj)) options.class = classObj;

    return vnode({tagName, ...options});
}

for (const tagName in tagsProperties) {
    h[tagName] = function (options) {
        return h({...options, tagName});
    };
}
