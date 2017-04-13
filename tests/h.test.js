import assert from 'assert';
import deepFreeze from 'deep-freeze-strict';
import h from '../h';

suite('h', function () {
    test('tagName', function () {
        assert.deepStrictEqual(
            h({tagName: 'span'}).toJSON(),
            {tagName: 'span', children: []},
        );
    });

    test('flat properties', function () {
        assert.deepStrictEqual(
            h({tagName: 'td', colSpan: 1}).toJSON(),
            {tagName: 'td', props: {colSpan: 1}, children: []}
        );
    });

    test('flat and nested properties', function () {
        assert.deepStrictEqual(
            h({
                tagName: 'td',
                colSpan: 1,
                props: {colSpan: 2, id: 'id'},
            }).toJSON(),
            {tagName: 'td', props: {id: 'id', colSpan: 2}, children: []}
        );
    });

    test('options object is not mutaged', function () {
        h(deepFreeze(
            {tagName: 'td', colSpan: 1, props: {colSpan: 2, id: 'id'}}
        ));
    });

    test('tag shorthand function', function () {
        assert.deepStrictEqual(
            h.td({key: 'test', colSpan: 1, children: 'str'}).toJSON(),
            {
                tagName: 'td',
                key: 'test',
                props: {colSpan: 1},
                children: [{text: 'str'}],
            }
        );
    });

    test('tag shorthand function options object is not mutated', function () {
        h.td(deepFreeze({key: 'test', colSpan: 1, children: 'str'}));
    });

    test('className and classToggle', function () {
        assert.deepStrictEqual(
            h.span({
                className: ['base1 test1', 'test2', 'test3'],
                classToggle: {
                    test3: false,
                    test4: true,
                    'base2 test5': true,
                    'base2 test6': false,
                },
            }).toJSON().class,
            {
                base1: true,
                test1: true,
                test2: true,
                test3: true,
                test4: true,
                base2: true,
                test5: true,
                test6: false,
            }
        );
    });
});
