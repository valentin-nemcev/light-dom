import assert from 'assert';
import jsdom from 'mocha-jsdom';
import h from '../h';
import patch from '../patch';

suite('patch', function () {

    jsdom();

    suite('Text node', function () {
        test('initial new node patch', function () {
            const node = patch(null, h({text: 'test'}));
            assert.strictEqual(node.textContent, 'test');
        });

        test('initial existing node patch', function () {
            const node = document.createTextNode('test1');
            assert.strictEqual(patch(node, h({text: 'test2'})), node);
            assert.strictEqual(node.textContent, 'test2');
        });

        test('sequential patch', function () {
            const vnode1 = h({text: 'test1'});
            const vnode2 = h({text: 'test2'});
            const node = patch(null, vnode1);

            assert.strictEqual(patch(vnode1, vnode2), node);
            assert.strictEqual(node.textContent, 'test2');
        });
    });

    suite('Element node', function () {
        test('initial new node patch', function () {
            const vnode = h({tagName: 'div', id: 'id', children: 'test'});
            const div = patch(null, vnode);
            assert.strictEqual(div.outerHTML, '<div id="id">test</div>');
        });

        test('initial new node patch with key', function () {
            const vnode = h({tagName: 'div', key: 'key', children: 'test'});
            const div = patch(null, vnode);
            assert.strictEqual(div.outerHTML, '<div>test</div>');
        });

        test('initial existing node patch', function () {
            const div = document.createElement('div');
            const vnode = h({
                tagName: 'div',
                id: 'id',
                title: 'test title',
                class: {class1: true, class2: true},
                style: {minHeight: '100%'},
                children: 'test',
            });
            assert.strictEqual(patch(div, vnode), div);
            assert.strictEqual(
                div.outerHTML,
                '<div class="class1 class2" id="id" title="test title"'
                + ' style="min-height: 100%;">test</div>'
            );
        });

        test('sequential node patch', function () {
            const vnode1 = h({
                tagName: 'div',
                id: 'id1',
                title: 'test title',
                class: {class1: true, class2: true},
                style: {color: 'red', minHeight: '100%'},
                children: 'test',
            });
            const vnode2 = h({
                tagName: 'div',
                id: 'id2',
                lang: 'en',
                title: '',
                class: {class2: true, class3: true},
                style: {minHeight: '100%', maxHeight: '200%'},
                children: 'test',
            });
            const div = patch(null, vnode1);
            patch(vnode1, vnode2);
            assert.strictEqual(
                div.outerHTML,
                '<div class="class2 class3" id="id2" title=""'
                + ' style="min-height: 100%; max-height: 200%;"'
                + ' lang="en">test</div>'
            );
        });
    });

    suite('Node replacement', function () {
        test('replace element with text', function () {
            const vdiv = h({tagName: 'div'});
            const div = patch(null, vdiv);
            const text = patch(vdiv, h({text: 'test'}));
            assert.notStrictEqual(div, text);
        });
    });

    suite('Node children', function () {
        let div;
        setup(function () {
            div = document.createElement('div');
        });

        test('Add children', function () {
            const vnode1 = h.div({children: []});
            const vnode2 = h.div({children: [
                h.span({children: 'span'}),
                'text',
                h.div({children: 'div'}),
            ]});
            patch(div, vnode1);

            patch(vnode1, vnode2);
            assert.strictEqual(
                div.innerHTML,
                '<span>span</span>text<div>div</div>'
            );
        });

        test('Remove children', function () {
            const vnode1 = h.div({children: [
                h.span({children: 'span'}),
                'text',
                h.div({children: 'div'}),
            ]});
            const vnode2 = h.div({children: []});
            patch(div, vnode1);

            patch(vnode1, vnode2);
            assert.strictEqual(div.innerHTML, '');
        });

        test('Replace multiple children', function () {
            const vnode1 = h.div({children: [
                'text',
                h.div({children: 'div'}),
                h.span({children: 'span'}),
                h.div({children: 'div', id: 1}),
            ]});
            const vnode2 = h.div({children: [
                h.span({children: 'span'}),
                'text',
                h.div({children: 'div'}),
                h.div({children: 'div', id: 2}),
            ]});
            patch(div, vnode1);

            patch(vnode1, vnode2);
            assert.strictEqual(
                div.innerHTML,
                '<span>span</span>text<div>div</div><div id="2">div</div>'
            );
        });

        test('Rearrange cached children', function () {
            const children = [];
            for (let i = 0; i < 5; i++) children.push(h.div({children: i}));
            const [child0, child1, child2, child3, child4] = children;
            const vnode1 = h.div({children: [
                child0, child1, child2, child3,
            ]});
            const vnode2 = h.div({children: [
                child4, child3, child1, child2,
            ]});
            patch(div, vnode1);
            const [, el1, el2, el3] = div.children;

            patch(vnode1, vnode2);
            const [, newEl3, newEl1, newEl2] = div.children;
            assert.strictEqual(
                div.innerHTML,
                '<div>4</div><div>3</div><div>1</div><div>2</div>'
            );

            assert.strictEqual(el1, newEl1);
            assert.strictEqual(el2, newEl2);
            assert.strictEqual(el3, newEl3);
        });

        test('Duplicated children', function () {
            const ch = h.div({children: 'div'});
            assert.throws(() => {
                const vnode1 = h.div({children: [
                    ch,
                    'text',
                    ch,
                ]});
                patch(div, vnode1);
            },
                'Child VNode used more than once',
            );
        });

        test('Duplicated siblings', function () {
            const ch = h.div({children: 'div'});
            const vnode1 = h.div({children: [
                h.div({children: [ch]}),
                'text',
                h.div({children: [ch]}),
            ]});
            assert.throws(
                () => patch(div, vnode1),
                // /element already inserted/i
                /can't overwrite element/i
            );
        });
    });
});
