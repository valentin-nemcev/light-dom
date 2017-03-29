import assert from 'assert';
import deepFreeze from 'deep-freeze-strict';
import h from '../h';

suite('h', function () {
    test('tagName', function () {
        assert.deepStrictEqual(
            h({tagName: 'span'}).toJSON(),
            {tagName: 'span', data: {}, children: []},
        );
    });

    test('flat properties', function () {
        assert.deepStrictEqual(
            h({tagName: 'td', colSpan: 1}).toJSON(),
            {tagName: 'td', data: {props: {colSpan: 1}}, children: []}
        );
    });

    test('flat and nested properties', function () {
        assert.deepStrictEqual(
            h({
                tagName: 'td',
                colSpan: 1,
                props: {colSpan: 2, id: 'id'},
            }).toJSON(),
            {tagName: 'td', data: {props: {id: 'id', colSpan: 2}}, children: []}
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
                data: {props: {colSpan: 1}},
                children: [{text: 'str'}],
            }
        );
    });

    test('tag shorthand function options object is not mutated', function () {
        h.td(deepFreeze({key: 'test', colSpan: 1, children: 'str'}));
    });
});
