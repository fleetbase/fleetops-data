import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE_PP, FIXED_DATE_SHORT, THREE_DAYS_DISTANCE, assertDateGetters, assertDefaults, assertRelationships } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | order config', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('relationships target the right models with the right loading strategy', function (assert) {
        assertRelationships(assert, this.store, 'order-config', {
            author: { kind: 'belongsTo', type: 'user' },
            category: { kind: 'belongsTo', type: 'category' },
            icon: { kind: 'belongsTo', type: 'file' },
        });
    });

    test('a new record applies its configured defaults', function (assert) {
        assertDefaults(assert, this.store.createRecord('order-config'), {
            core_service: false,
        });
    });

    test('updated_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('order-config'),
            'updated_at',
            {
                updatedAt: FIXED_DATE_PP,
                updatedAtShort: FIXED_DATE_SHORT,
            },
            {
                updatedAgo: THREE_DAYS_DISTANCE,
            }
        );
    });

    test('created_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('order-config'),
            'created_at',
            {
                createdAt: FIXED_DATE_PP,
                createdAtShort: FIXED_DATE_SHORT,
            },
            {
                createdAgo: THREE_DAYS_DISTANCE,
            }
        );
    });

    module('tags', function () {
        test('addTag appends to the tag list and replaces the array so tracking fires', function (assert) {
            const config = this.store.createRecord('order-config', { tags: [] });
            const before = config.tags;

            config.addTag('priority');

            assert.deepEqual(config.tags, ['priority']);
            assert.notStrictEqual(config.tags, before, 'a fresh array is assigned rather than mutated in place');
        });

        test('addTag keeps existing tags and allows duplicates', function (assert) {
            const config = this.store.createRecord('order-config', { tags: ['priority'] });

            config.addTag('fragile');
            config.addTag('fragile');

            assert.deepEqual(config.tags, ['priority', 'fragile', 'fragile'], 'deduplication is the caller’s job');
        });

        test('removeTag drops the tag at the given index', function (assert) {
            const config = this.store.createRecord('order-config', { tags: ['priority', 'fragile', 'cold'] });
            const before = config.tags;

            config.removeTag(1);

            assert.deepEqual(config.tags, ['priority', 'cold']);
            assert.notStrictEqual(config.tags, before, 'a fresh array is assigned');
        });

        test('removeTag rejects an index outside the list rather than silently doing nothing', function (assert) {
            const config = this.store.createRecord('order-config', { tags: ['priority'] });

            assert.throws(() => config.removeTag(5), /index/i, 'an out-of-range removal is a programming error, not a no-op');
            assert.deepEqual(config.tags, ['priority'], 'and the list is untouched');
        });
    });
});
