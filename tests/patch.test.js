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
});
