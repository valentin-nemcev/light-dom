import assert from 'assert';
import deepFreeze from 'deep-freeze-strict';
import vnode from '../vnode';

suite('vnode', function () {
    test('string key', function () {
        const key = 'key';
        assert.strictEqual(vnode({tagName: 'span', key}).key, key);
    });

    test('number key', function () {
        const key = 1;
        assert.strictEqual(vnode({tagName: 'span', key}).key, key);
    });

    test('non-string key', function () {
        const key = {object: true};
        assert.strictEqual(vnode({tagName: 'span', key}).key, key);
    });

    test('null key', function () {
        const key = null;
        assert.throws(() => vnode({tagName: 'span', key}));
    });

    test('ensure key with exiting key', function () {
        assert.strictEqual(
            vnode({tagName: 'span', key: 'key'}).ensureKey('otherKey').key,
            'key'
        );
    });

    test('ensure key without exiting key', function () {
        assert.strictEqual(
            vnode({tagName: 'span'}).ensureKey('otherKey').key,
            'otherKey'
        );
    });

    test('data values', function () {
        assert.deepStrictEqual(
            vnode({tagName: 'span', dataStr: 'str', dataNull: null}).toJSON(),
            {tagName: 'span', dataStr: 'str', dataNull: null, children: []}
        );
    });

    test('data objects', function () {
        const dataObj = {key: 'value'};
        assert.strictEqual(
            vnode({tagName: 'span', dataObj}).toJSON().dataObj,
            dataObj
        );
    });

    test('text nodes', function () {
        assert.deepStrictEqual(
            vnode({text: 'str'}).toJSON(),
            {text: 'str'}
        );
    });

    test('text children', function () {
        assert.deepStrictEqual(
            vnode({tagName: 'span', children: 'text'}).toJSON(),
            {tagName: 'span', children: [{text: 'text'}]}
        );
    });

    test('numeric children', function () {
        assert.deepStrictEqual(
            vnode({tagName: 'span', children: 123}).toJSON(),
            {tagName: 'span', children: [{text: '123'}]}
        );
    });

    test('boolean children', function () {
        assert.deepStrictEqual(
            vnode({tagName: 'span', children: false}).toJSON(),
            {tagName: 'span', children: [{text: 'false'}]}
        );
    });

    test('null children', function () {
        assert.deepStrictEqual(
            vnode({tagName: 'span', children: null}).toJSON(),
            {tagName: 'span', children: []}
        );
    });

    test('vnode children', function () {
        const childVnode = {};
        const n = vnode({tagName: 'span', children: childVnode});
        assert.strictEqual(n.children.length, 1);
        assert.strictEqual(n.children[0], childVnode);
        assert.strictEqual('text' in n, false);
    });

    test('mixed array children', function () {
        const childVnode1 = vnode({tagName: 'span'});
        const childVnode2 = vnode({tagName: 'div'});
        const childVnode3 = vnode({tagName: 'ul'});
        const n = vnode({tagName: 'div', children: [
            undefined,
            null,
            false,
            123,
            '',
            'text1',
            childVnode1,
            [
                childVnode2,
                null,
                'text2',
                childVnode3,
            ],
        ]});
        assert.deepStrictEqual(n.toJSON(), {
            tagName: 'div',
            children: [
                {text: 'false'},
                {text: '123'},
                {text: ''},
                {text: 'text1'},
                {tagName: 'span', children: []},
                {tagName: 'div', children: []},
                {text: 'text2'},
                {tagName: 'ul', children: []},
            ],
        });

        assert.strictEqual(n.children[4], childVnode1);
        assert.strictEqual(n.children[5], childVnode2);
    });

    test('options object is not mutated', function () {
        vnode(deepFreeze({
            tagName: 'div',
            key: 'key',
            dataObj: {key: 'value'},
            children: [
                undefined,
                null,
                false,
                123,
                '',
                'text1',
                {sel: 'child1'},
                [
                    {sel: 'child2'},
                    null,
                    'text2',
                    {sel: 'child3'},
                ],
            ],
        }));
    });
});
