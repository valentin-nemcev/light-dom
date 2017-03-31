import assert from 'assert';

import {fromElement} from './vnode';

function ensureVNode(node) {
    return node.isVNode ? node : fromElement(node);
}

export default function initialPatch(oldNode, newNode) {
    if (oldNode != null) {
        return patch(ensureVNode(oldNode), newNode);
    } else {
        return patch(newVNode(newNode), newNode);
    }
}

function newVNode(vNode) {
    if (vNode.tagName != null) {
        return {
            tagName: vNode.tagName,
            key: vNode.key,
            elm: vNode.elm || document.createElement(vNode.tagName),
            data: {},
            childrenMap: new Map(),
            children: [],
        };
    } else {
        return {
            text: '',
            elm: vNode.elm || document.createTextNode(''),
        };
    }
}

function patchObject(oldObj = {}, newObj = {}, set) {
    for (const key in newObj) {
        if (oldObj[key] !== newObj[key]) set(key, oldObj[key], newObj[key]);
    }
    for (const key in oldObj) {
        if (!(key in newObj)) set(key, oldObj[key], undefined);
    }
}


function replaceWith(elm, newElm) {
    if (elm.parentNode) elm.parentNode.replaceChild(newElm, elm);
}

function patch(oldNode, newNode) {

    const elm = oldNode.elm;
    assert(elm != null, 'No element to patch');

    if (oldNode === newNode) {
        return elm;
    }

    if (oldNode.tagName !== newNode.tagName || oldNode.key !== newNode.key) {
        const newElm = patch(newVNode(newNode), newNode);
        replaceWith(elm, newElm);
        return newElm;
    }

    newNode.elm = elm;

    if (newNode.tagName != null) {
        patchElement(oldNode, newNode);
    } else {
        if (oldNode.text !== newNode.text) {
            elm.nodeValue = newNode.text;
        }
    }
    return newNode.elm;
}

function patchElement(oldNode, newNode) {
    const elm = oldNode.elm;

    const oldCh = oldNode.children;
    const newCh = newNode.children;

    let prevEl = null;
    for (let i = 0; i < Math.max(newCh.length, oldCh.length); i++) {
        const oldChNode = oldCh[i];
        const newChNode = newCh[i];

        const shouldRemoveOld =
            oldChNode && !newNode.childrenMap.has(oldChNode);
        const shouldInsertNew =
            newChNode && !oldNode.childrenMap.has(newChNode);

        if (shouldRemoveOld && shouldInsertNew) {
            patch(oldChNode, newChNode);
        } else if (shouldRemoveOld) {
            oldChNode.elm.remove();
        } else if (shouldInsertNew) {
            patch(newVNode(newChNode), newChNode);
        }

        if (newChNode) {
            const refNode = prevEl ? prevEl.nextSibling : elm.firstChild;
            if (refNode !== newChNode.elm) {
                if (refNode) {
                    elm.insertBefore(newChNode.elm, refNode);
                } else {
                    elm.appendChild(newChNode.elm);
                }
                const insertHook =
                    ((newChNode.data || {}).hook || {}).insert;
                insertHook && insertHook(newChNode);
            }
            prevEl = newChNode.elm;
        }
    }

    patchObject(oldNode.data.class, newNode.data.class,
        (name, oldValue, newValue) => elm.classList.toggle(name, newValue)
    );
    patchObject(oldNode.data.props, newNode.data.props,
        (name, oldValue, newValue) => {
            if (newValue !== undefined) elm[name] = newValue;
            else delete elm[name];
        }
    );
    patchObject(oldNode.data.on, newNode.data.on,
        (name, oldHandler, newHandler) => {
            if (oldHandler) elm.removeEventListener(name, oldHandler);
            if (newHandler) elm.addEventListener(name, newHandler);
        }
    );
    patchObject(oldNode.data.style, newNode.data.style,
        (name, oldValue, newValue) => {
            elm.style[name] = newValue != null ? newValue : '';
        }
    );

    const updateHook = (newNode.data.hook || {}).update;
    updateHook && updateHook(oldNode, newNode);
}
