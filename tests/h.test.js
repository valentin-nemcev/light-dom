import assert from 'assert';
import deepFreeze from 'deep-freeze-strict';
import h from '../h';

suite('h', function () {
    test('tagName', function () {
        assert.deepStrictEqual(
            h({tagName: 'span'}),
            {sel: 'span', text: ''},
        )
    });

    test('selector', function () {
        assert.deepStrictEqual(
            h({selector: 'span#id.class'}),
            {sel: 'span#id.class', text: ''},
        )
    });

    test('tagName and selector', function () {
        assert.deepStrictEqual(
            h({tagName: 'span', selector: '#id.class'}),
            {sel: 'span#id.class', text: ''},
        )
    });

    test('flat properties', function () {
        assert.deepStrictEqual(
            h({tagName: 'td', colSpan: 1}),
            {sel: 'td', data: {props: {colSpan: 1}}, text: ''}
        );
    });

    test('flat and nested properties', function () {
        assert.deepStrictEqual(
            h({tagName: 'td', colSpan: 1, props: {colSpan: 2, id: 'id'}}),
            {sel: 'td', data: {props: {id: 'id', colSpan: 2}}, text: ''}
        );
    });

    test('options object is not mutaged', function () {
        h(deepFreeze(
            {tagName: 'td', colSpan: 1, props: {colSpan: 2, id: 'id'}}
        ));
    });

    test('tag shorthand function', function () {
        assert.deepStrictEqual(
            h.td({selector: '.test', colSpan: 1, children: 'str'}),
            {sel: 'td.test', data: {props: {colSpan: 1}}, text: 'str'}
        );
    });

    test('tag shorthand function options object is not mutated', function () {
        h.td(deepFreeze({selector: '.test', colSpan: 1, children: 'str'}));
    });
});
