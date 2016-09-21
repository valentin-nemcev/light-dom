import idl4js from 'idl4js';
import tags from 'idl4js/json/_tags.json';
import {writeFileSync} from 'fs';

const html5Interfaces = Object.assign({}, idl4js.html5(), idl4js.dom4());
const html5Tags = tags.HTML;

function getInterfaceChain(name, interfaces, result = []) {
    result.unshift(name);
    interfaces[name].inherits.forEach(
        (name) => {
            if (name !== 'HTMLElement' && name !== 'Node')
                getInterfaceChain(name, interfaces, result)
        }
    );
    return result;
}

function mergeProperties(properties, result = {}) {
    for (const p of properties) {
        for (const [name, type] of Object.entries(p || {})) {
            if (type.match(/EventHandler/)) continue;
            result[name] = type;
        }
    }
    return result;
}

const tagProps = {};

const entries = [['_global', ''], ...Object.entries(html5Tags)];

for (const [tagName, interfacePart] of entries) {
    const interfaces = interfacePart !== '' || tagName === '_global'
        ? getInterfaceChain(`HTML${interfacePart}Element`, html5Interfaces)
        : [];
    tagProps[tagName] =
        mergeProperties(interfaces.map(i => html5Interfaces[i].properties));
}

writeFileSync('tagsProperties.json', JSON.stringify(tagProps, null, '    '));
