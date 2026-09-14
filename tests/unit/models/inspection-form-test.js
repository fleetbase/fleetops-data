import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE_LONG, assertAttributeTypes, assertDateGetters, assertRelationships } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | inspection-form', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('it declares its attribute and relationship contract', function (assert) {
        assertAttributeTypes(assert, this.store, 'inspection-form', {
            public_id: 'string',
            subject_uuid: 'string',
            subject_type: 'string',
            name: 'string',
            items: 'raw',
            item_count: 'number',
            is_published: 'boolean',
            published_at: 'date',
            created_at: 'date',
            updated_at: 'date',
        });
        assertRelationships(assert, this.store, 'inspection-form', {
            subject: { kind: 'belongsTo', type: 'maintenance-subject', async: false, polymorphic: true },
        });
    });

    test('displayName prefers the name and falls back to the public id', function (assert) {
        const form = this.store.createRecord('inspection-form', { public_id: 'form_1' });

        assert.strictEqual(form.displayName, 'form_1');

        form.set('name', 'Pre-trip');

        assert.strictEqual(form.displayName, 'Pre-trip');
    });

    test('it no longer declares a frequency attribute', function (assert) {
        assert.notOk(this.store.modelFor('inspection-form').attributes.has('frequency'), 'inspection-form does not declare `frequency`');
    });

    test('published_at renders its formatting getter', function (assert) {
        assertDateGetters(assert, this.store.createRecord('inspection-form'), 'published_at', {
            publishedAt: FIXED_DATE_LONG,
        });
    });

    test('created_at renders its formatting getter', function (assert) {
        assertDateGetters(assert, this.store.createRecord('inspection-form'), 'created_at', {
            createdAt: FIXED_DATE_LONG,
        });
    });

    test('updated_at renders its formatting getter', function (assert) {
        assertDateGetters(assert, this.store.createRecord('inspection-form'), 'updated_at', {
            updatedAt: FIXED_DATE_LONG,
        });
    });
});
