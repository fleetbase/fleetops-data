import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { EMBEDDED, assertEmbeddedAttrs, assertNormalizesUuidAsId, assertPrimaryKeyIsUuid } from 'dummy/tests/helpers/serializer-contract';

module('Unit | Serializer | inspection-form', function (hooks) {
    setupTest(hooks);

    test('it keys records by uuid and embeds the subject and custom fields', function (assert) {
        const store = this.owner.lookup('service:store');

        assertPrimaryKeyIsUuid(assert, store, 'inspection-form');
        assertEmbeddedAttrs(assert, store, 'inspection-form', {
            subject: EMBEDDED,
            custom_field_values: EMBEDDED,
        });
    });

    test('a server payload is normalized onto a record keyed by uuid', function (assert) {
        const form = assertNormalizesUuidAsId(assert, this.owner.lookup('service:store'), 'inspection-form', { name: 'Pre-trip' });

        assert.strictEqual(form.name, 'Pre-trip');
    });
});
