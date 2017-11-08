import assert from 'assert';
import deepFreeze from 'deep-freeze-strict';
import h, {c, toggleClasses} from '../h';

const defaultProps = {
    id: '',
    className: '',
    title: '',
    lang: '',
    dir: '',
    hidden: false,
    tabIndex: -1,
    accessKey: '',
};

const defaultTdProps = {
    colSpan: 1,
    rowSpan: 1,
    abbr: '',
    align: '',
    axis: '',
    height: '',
    width: '',
    ch: '',
    chOff: '',
    noWrap: false,
    vAlign: '',
    bgColor: '',
    ...defaultProps,
};

suite('h', function () {
    test('tagName', function () {
        assert.deepStrictEqual(
            h({tagName: 'span'}).toJSON(),
            {tagName: 'span', children: [], defaultProps},
        );
    });

    test('flat properties', function () {
        assert.deepStrictEqual(
            h({tagName: 'td', colSpan: 1}).toJSON(),
            {
                tagName: 'td',
                props: {colSpan: 1},
                defaultProps: defaultTdProps,
                children: [],
            }
        );
    });

    test('flat and nested properties', function () {
        assert.deepStrictEqual(
            h({
                tagName: 'td',
                colSpan: 1,
                props: {colSpan: 2, id: 'id'},
            }).toJSON(),
            {
                tagName: 'td',
                props: {id: 'id', colSpan: 2},
                defaultProps: defaultTdProps,
                children: [],
            }
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
                defaultProps: defaultTdProps,
                children: [{text: 'str'}],
            }
        );
    });

    test('tag shorthand function options object is not mutated', function () {
        h.td(deepFreeze({key: 'test', colSpan: 1, children: 'str'}));
    });
});

test('c', function () {
    assert.deepStrictEqual(
        c('base1 test1', 'test2', 'test3', {
            test3: false,
            test4: true,
            'base2 test5': true,
            'base2 test6': false,
        }),
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

test('toggleClasses', function () {
    assert.deepStrictEqual(
        toggleClasses({
            class1: '__class1',
            class2: '__class2',
            class3: '__class3',
            class4: '__class4',
        }, {
            class1: true,
            class3: false,
        }),
        {
            __class1: true,
            __class3: false,
        }
    );
});
