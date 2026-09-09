import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { EMBEDDED, assertEmbeddedAttrs, assertNormalizesUuidAsId, assertPrimaryKeyIsUuid } from 'dummy/tests/helpers/serializer-contract';
import { assertPolymorphicTypeContract, snapshotStub } from 'dummy/tests/helpers/polymorphic-contract';

module('Unit | Serializer | waypoint', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
        this.serializer = this.store.serializerFor('waypoint');
        this.modelClass = this.store.modelFor('waypoint');
    });

    test('it keys records by uuid and declares the expected embedded relationships', function (assert) {
        assertPrimaryKeyIsUuid(assert, this.store, 'waypoint');
        assertEmbeddedAttrs(assert, this.store, 'waypoint', {
            place: EMBEDDED,
            customer: EMBEDDED,
            tracking_number: EMBEDDED,
        });
    });

    test('a server payload is normalized onto a record keyed by uuid', function (assert) {
        assertNormalizesUuidAsId(assert, this.store, 'waypoint', { tracking: 'TRK1' });
    });

    module('normalizing a waypoint that arrived as a place', function () {
        test('the address fields are lifted into an embedded place relationship', function (assert) {
            const normalized = this.serializer.normalize(this.modelClass, {
                id: 'place_abc',
                uuid: 'place-uuid-1',
                name: 'Depot',
                address: '1 Main St, Singapore',
                street1: '1 Main St',
                city: 'Singapore',
                country: 'SG',
                postal_code: '018956',
                phone: '+6560000000',
            });

            const place = normalized.included.find((resource) => resource.type === 'place');

            assert.ok(place, 'a place resource is produced alongside the waypoint');
            assert.strictEqual(place.attributes.public_id, 'place_abc', 'the original place id is preserved');
            assert.strictEqual(place.attributes.name, 'Depot');
            assert.strictEqual(place.attributes.city, 'Singapore');
            assert.strictEqual(normalized.data.relationships.place.data.id, 'place-uuid-1', 'and the waypoint points at it');
        });

        test('a payload that is already a waypoint is left alone', function (assert) {
            const normalized = this.serializer.normalize(this.modelClass, {
                id: 'waypoint_abc',
                uuid: 'waypoint-uuid-1',
                name: 'Stop A',
            });

            assert.notOk(normalized.data.relationships.place, 'no place relationship is invented');
        });

        test('a payload with no id at all is left alone', function (assert) {
            const normalized = this.serializer.normalize(this.modelClass, { uuid: 'waypoint-uuid-2', name: 'Stop A' });

            assert.notOk(normalized.data.relationships.place);
        });

        test('a non-string id is left alone', function (assert) {
            const normalized = this.serializer.normalize(this.modelClass, { id: 42, uuid: 'waypoint-uuid-3', name: 'Stop A' });

            assert.notOk(normalized.data.relationships.place);
        });
    });

    test('customer sends the bare backend type, stripping the local subtype prefix', function (assert) {
        assertPolymorphicTypeContract(assert, {
            serializer: this.serializer,
            key: 'customer',
            stripped: { 'customer-contact': 'contact', 'customer-vendor': 'vendor', 'facilitator-vendor': 'vendor', contact: 'contact' },
        });
    });

    test('a type the related record carries itself overrides its model name', function (assert) {
        const json = {};

        this.serializer.serializePolymorphicType(snapshotStub({ belongsTo: { modelName: 'customer-contact', attr: () => 'customer-vendor' } }), json, { key: 'customer' });

        assert.strictEqual(json.customer_type, 'fleet-ops:vendor');
    });

    test('the relationship key is used verbatim when the serializer has no keyForAttribute hook', function (assert) {
        const json = {};

        this.serializer.serializePolymorphicType.call({}, snapshotStub({ belongsTo: { modelName: 'contact', attr: () => null } }), json, { key: 'customer' });

        assert.strictEqual(json.customer_type, 'fleet-ops:contact');
    });
});
