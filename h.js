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

function isEmptyObject(object) {
    for (const key in object) return false;
    return true;
}


export default function h({tagName = '', ...options}) {
    const [props, optionsSansProps] = extractProperties(tagName, options);
    const optionsNestingProps = optionsSansProps;
    if (!isEmptyObject(props)) {
        optionsNestingProps.props =
            Object.assign(props, optionsSansProps.props);
    }

    return vnode({tagName, ...optionsNestingProps});
}

for (const tagName in tagsProperties) {
    h[tagName] = function (options) {
        return h({...options, tagName});
    };
}
