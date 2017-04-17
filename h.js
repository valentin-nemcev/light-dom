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

export function toggleClasses(classes, toggles) {
    const result = {};
    for (const t in toggles) {
        if (t in classes) result[classes[t]] = toggles[t];
    }
    return result;
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
