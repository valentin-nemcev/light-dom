import assert from 'assert';

import {fromElement} from './vnode';

function ensureVNode(node) {
    return node == null || node.isVNode ? node : fromElement(node);
}

let patchSeqNo = 0;

export default function initialPatch(oldNode, newNode) {
    if (newNode == null) return;
    return patch(ensureVNode(oldNode), newNode, patchSeqNo++);
}

function getPlaceholderWithElement(vNode) {
    return vNode.createEmptyCopy().setElement(
        vNode.elm || vNode.isElementNode
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

function replaceElement(node, seqNo, newElm) {
    if (node.wasUpdated(seqNo)) return;
    node.beforeDetach(newElm);
    if (newElm === null) node.elm.remove();
    else if (node.elm.parentNode)
        node.elm.parentNode.replaceChild(newElm, node.elm);
}

function insertElement(node, parentElm, afterElm) {
    const beforeElm = afterElm
        ? afterElm.nextSibling
        : parentElm.firstChild;
    if (beforeElm !== node.elm) {
        const prevParentElm = node.elm.parentNode;
        if (prevParentElm != null && prevParentElm !== parentElm)
            node.beforeDetach();
        if (beforeElm) {
            parentElm.insertBefore(node.elm, beforeElm);
        } else {
            parentElm.appendChild(node.elm);
        }
        if (prevParentElm !== parentElm) {
            node.afterAttach();
        }
    }
}

function patch(oldNode, newNode, seqNo) {

    if (oldNode == null && newNode.elm != null || oldNode === newNode)
        return newNode.reused(seqNo).elm;

    if (oldNode == null && newNode.elm == null)
        oldNode = getPlaceholderWithElement(newNode);

    const elm = oldNode.elm;
    assert(elm != null, 'No element to patch');

    if (!oldNode.canBeUpdatedBy(newNode)) {
        // Old node removed (replaced)
        const newElm = patch(null, newNode, seqNo);
        replaceElement(oldNode, seqNo, newElm);
        return newElm;
    } else {
        // Old node updated with new
        // New node updates old node
        oldNode.updateBy(newNode, seqNo);

        if (newNode.isElementNode) {
            updateChildren(oldNode, newNode, seqNo);
            updateElement(oldNode, newNode);
        } else {
            updateTextNode(oldNode, newNode);
        }
        oldNode.afterUpdateBy(newNode);
    }
    return newNode.elm;
}

function updateTextNode(oldNode, newNode) {
    if (oldNode.text !== newNode.text) {
        oldNode.elm.nodeValue = newNode.text;
    }
}

function updateChildren(oldNode, newNode, seqNo) {
    const oldCh = oldNode.children;
    const newCh = newNode.children;

    let prevEl = null;
    for (let i = 0; i < Math.max(newCh.length, oldCh.length); i++) {
        const oldChNode = oldCh[i];
        const newChNode = newCh[i];

        const shouldRemoveOld =
            oldChNode && !newNode.hasChild(oldChNode);
        const shouldInsertNew =
            newChNode && !oldNode.hasChild(newChNode);

        if (shouldRemoveOld === shouldInsertNew) {
            patch(oldChNode, newChNode, seqNo);
        } else if (shouldRemoveOld) {
            // Old node removed
            replaceElement(oldChNode, seqNo, null);
        } else if (shouldInsertNew) {
            patch(null, newChNode, seqNo);
        }

        // New node moved or inserted
        if (newChNode) {
            insertElement(newChNode, oldNode.elm, prevEl);
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
