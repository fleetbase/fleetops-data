import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { assertAttributeTypes, assertRelationships } from 'dummy/tests/helpers/model-contract';

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

    test('the camelCase date getters expose the raw dates', function (assert) {
        const published = new Date(2026, 8, 1);
        const created = new Date(2026, 7, 1);
        const updated = new Date(2026, 7, 2);
        const form = this.store.createRecord('inspection-form', { published_at: published, created_at: created, updated_at: updated });

        assert.strictEqual(form.publishedAt, published);
        assert.strictEqual(form.createdAt, created);
        assert.strictEqual(form.updatedAt, updated);
    });
});
