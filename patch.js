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
        || vNode.isElementNode
        ? document.createElement(vNode.tagName)
        : document.createTextNode('')
    );
}

function diffObject(oldObj = {}, newObj = {}, set) {
    for (const key in newObj) {
        if (oldObj[key] !== newObj[key]) set(key, oldObj[key], newObj[key]);
    }
    for (const key in oldObj) {
        if (!(key in newObj)) set(key, oldObj[key], undefined);
    }
}


function removeElement(elm) {
    elm.remove();
}

function replaceElement(elm, newElm) {
    if (elm.parentNode) elm.parentNode.replaceChild(newElm, elm);
}

function insertElement(elm, parentElm, afterNode) {
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
        // Updated without changes
        return elm;
    } else if (!oldNode.canBeUpdatedBy(newNode)) {
        // Old node removed (replaced)
        const newElm = patch(null, newNode);
        replaceElement(elm, newElm);
        return newElm;
    } else {
        // Old node updated with new
        // New node updates old node
        newNode.setElement(elm);

        if (newNode.isElementNode) {
            updateChildren(oldNode, newNode);
            updateElement(oldNode, newNode);
        } else {
            updateTextNode(oldNode, newNode);
        }
    }
    return newNode.elm;
}

function updateTextNode(oldNode, newNode) {
    if (oldNode.text !== newNode.text) {
        oldNode.elm.nodeValue = newNode.text;
    }
}

function updateChildren(oldNode, newNode) {
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
            // Old node removed
            removeElement(oldChNode.elm);
        } else if (shouldInsertNew) {
            patch(null, newChNode);
        }

        // New node moved or inserted
        if (newChNode) {
            insertElement(newChNode.elm, oldNode.elm, prevEl);
            const insertHook =
                (newChNode.hook || {}).insert;
            insertHook && insertHook(newChNode);
            prevEl = newChNode.elm;
        }
    }
}

function updateElement(oldNode, newNode) {
    const elm = oldNode.elm;

    diffObject(oldNode.class, newNode.class,
        (name, oldValue, newValue) => elm.classList.toggle(name, newValue)
    );
    diffObject(oldNode.props, newNode.props,
        (name, oldValue, newValue) => {
            if (newValue !== undefined) elm[name] = newValue;
            else delete elm[name];
        }
    );
    diffObject(oldNode.on, newNode.on,
        (name, oldHandler, newHandler) => {
            if (oldHandler) elm.removeEventListener(name, oldHandler);
            if (newHandler) elm.addEventListener(name, newHandler);
        }
    );
    diffObject(oldNode.style, newNode.style,
        (name, oldValue, newValue) => {
            elm.style[name] = newValue != null ? newValue : '';
        }
    );

    const updateHook = (newNode.hook || {}).update;
    updateHook && updateHook(oldNode, newNode);
}
