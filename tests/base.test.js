import assert from 'assert';
import deepFreeze from 'deep-freeze-strict';
import {base as h} from '../h';

suite('Base', function () {
    test('selector', function () {
        assert.deepStrictEqual(
            h({selector: 'span#id.class'}),
            {sel: 'span#id.class', data: {}, text: ''},
        );
    });

    test('key', function () {
        const key = Symbol('key');
        assert.strictEqual(h({selector: 'span', key}).key, key);
    });

    test('data values', function () {
        assert.deepStrictEqual(
            h({selector: 'span', dataStr: 'str', dataNull: null}).data,
            {dataStr: 'str', dataNull: null}
        );
    });

    test('data objects', function () {
        const dataObj = {key: 'value'};
        assert.strictEqual(
            h({selector: 'span', dataObj}).data.dataObj,
            dataObj
        );
    });

    test('text children', function () {
        assert.deepStrictEqual(
            h({selector: 'span', children: 'text'}),
            {sel: 'span', data: {}, text: 'text'}
        );
    });

    test('numeric children', function () {
        assert.deepStrictEqual(
            h({selector: 'span', children: 123}),
            {sel: 'span', data: {}, text: '123'}
        );
    });

    test('boolean children', function () {
        assert.deepStrictEqual(
            h({selector: 'span', children: false}),
            {sel: 'span', data: {}, text: 'false'}
        );
    });

    test('null children', function () {
        assert.deepStrictEqual(
            h({selector: 'span', children: null}),
            {sel: 'span', data: {}, text: ''}
        );
    });

    test('vnode children', function () {
        const childVnode = {};
        const vnode = h({selector: 'span', children: childVnode});
        assert.strictEqual(vnode.children.length, 1);
        assert.strictEqual(vnode.children[0], childVnode);
        assert.strictEqual('text' in vnode, false);
    });

    test('mixed array children', function () {
        const childVnode1 = {sel: 'child1'};
        const childVnode2 = {sel: 'child2'};
        const childVnode3 = {sel: 'child3'};
        const vnode = h({selector: 'div', children: [
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
        assert.deepStrictEqual(vnode, {
            sel: 'div',
            data: {},
            children: [
                {text: 'false'},
                {text: '123'},
                {text: ''},
                {text: 'text1'},
                {sel: 'child1'},
                {sel: 'child2'},
                {text: 'text2'},
                {sel: 'child3'},
            ],
        });

        assert.strictEqual(vnode.children[4], childVnode1);
        assert.strictEqual(vnode.children[5], childVnode2);
    });

    test('options object is not mutated', function () {
        h(deepFreeze({
            tagName: 'div',
            selector: '.test',
            key: {key: 'value'},
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
