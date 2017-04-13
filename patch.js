import assert from 'assert';

import {fromElement} from './vnode';

function ensureVNode(node) {
    return node == null || node.isVNode ? node : fromElement(node);
}

export default function initialPatch(oldNode, newNode) {
    if (newNode == null) return;
    return patch(ensureVNode(oldNode), newNode);
}

function newVNodeWithElement(vNode) {
    return vNode.createEmptyCopy().setElement(vNode.elm
        || vNode.tagName != null
        ? document.createElement(vNode.tagName)
        : document.createTextNode('')
    );
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

function insertAfter(elm, parentElm, afterNode) {
    const beforeNode = afterNode
        ? afterNode.nextSibling
        : parentElm.firstChild;
    if (beforeNode !== elm) {
        if (beforeNode) {
            parentElm.insertBefore(elm, beforeNode);
        } else {
            parentElm.appendChild(elm);
        }
    }
}

function patch(oldNode, newNode) {

    if (oldNode == null) oldNode = newVNodeWithElement(newNode);

    const elm = oldNode.elm;
    assert(elm != null, 'No element to patch');

    if (oldNode === newNode) {
        return elm;
    }

    if (oldNode.tagName !== newNode.tagName || oldNode.key !== newNode.key) {
        const newElm = patch(null, newNode);
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
            patch(null, newChNode);
        }

        if (newChNode) {
            insertAfter(newChNode.elm, elm, prevEl);
            const insertHook =
                (newChNode.hook || {}).insert;
            insertHook && insertHook(newChNode);
            prevEl = newChNode.elm;
        }
    }

    patchObject(oldNode.class, newNode.class,
        (name, oldValue, newValue) => elm.classList.toggle(name, newValue)
    );
    patchObject(oldNode.props, newNode.props,
        (name, oldValue, newValue) => {
            if (newValue !== undefined) elm[name] = newValue;
            else delete elm[name];
        }
    );
    patchObject(oldNode.on, newNode.on,
        (name, oldHandler, newHandler) => {
            if (oldHandler) elm.removeEventListener(name, oldHandler);
            if (newHandler) elm.addEventListener(name, newHandler);
        }
    );
    patchObject(oldNode.style, newNode.style,
        (name, oldValue, newValue) => {
            elm.style[name] = newValue != null ? newValue : '';
        }
    );

    const updateHook = (newNode.hook || {}).update;
    updateHook && updateHook(oldNode, newNode);
}
