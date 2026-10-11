import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import {
    present,
    first,
    lookupService,
    relation,
    photo,
    icon,
    badge,
    badges,
    fact,
    relatedFact,
    dateLabel,
    typeLabel,
    money,
    join,
    polymorphicType,
    extensionManager,
    engineInstalled,
    engineOpener,
    FLEETOPS_ENGINE,
} from '@fleetbase/fleetops-data/utils/resource-descriptors/helpers';
import { PLACEHOLDER_IMAGES } from '@fleetbase/fleetops-data/utils/placeholder-images';

module('Unit | Utility | resource-descriptors/helpers', function (hooks) {
    setupTest(hooks);

    test('present and first read attributes by path and skip blanks', function (assert) {
        assert.false(present(undefined));
        assert.false(present(null));
        assert.false(present('   '));
        assert.true(present(0));
        assert.true(present('x'));

        assert.strictEqual(first(null, 'name'), null, 'no record');
        assert.strictEqual(first({ name: '', nested: { label: 'Deep' } }, 'name', 'nested.label'), 'Deep');
        assert.strictEqual(first({ name: '' }, 'name', 'missing'), null);
    });

    test('lookupService returns null when the owner cannot provide the service', function (assert) {
        assert.strictEqual(lookupService(null, 'anything'), null);
        assert.strictEqual(lookupService({ lookup: () => null }, 'anything'), null);
        assert.strictEqual(
            lookupService(
                {
                    lookup() {
                        throw new Error('nope');
                    },
                },
                'anything'
            ),
            null
        );

        const service = {};
        assert.strictEqual(lookupService({ lookup: () => service }, 'anything'), service);
    });

    test('relation goes through the resource registry when there is one', function (assert) {
        const vehicle = { id: 'vehicle_1' };
        const registry = { relationValue: (record, name) => (name === 'vehicle' ? vehicle : null) };
        const owner = { lookup: (name) => (name === 'service:resource-registry' ? registry : null) };

        assert.strictEqual(relation(owner, { vehicle: 'ignored' }, 'vehicle'), vehicle);
    });

    test('relation falls back to the attribute, unwrapping a promise proxy, without a registry', function (assert) {
        const owner = { lookup: () => null };
        const vehicle = { id: 'vehicle_1' };

        assert.strictEqual(relation(owner, null, 'vehicle'), null, 'no record');
        assert.strictEqual(relation(owner, {}, 'vehicle'), null, 'no relation');
        assert.strictEqual(relation(owner, { vehicle }, 'vehicle'), vehicle, 'a plain value');
        assert.strictEqual(relation(owner, { vehicle: { then() {}, content: vehicle } }, 'vehicle'), vehicle, 'a resolved proxy');
        assert.strictEqual(relation(owner, { vehicle: { then() {} } }, 'vehicle'), null, 'an unresolved proxy');
    });

    test('photo pairs the record photo with the typed placeholder and shape', function (assert) {
        assert.deepEqual(photo({ photo_url: 'https://cdn.test/a.png' }, 'driver'), { url: 'https://cdn.test/a.png', fallback: PLACEHOLDER_IMAGES.driver, shape: 'round' });
        assert.deepEqual(photo({}, 'vehicle'), { url: PLACEHOLDER_IMAGES.vehicle, fallback: PLACEHOLDER_IMAGES.vehicle, shape: 'square' });
        assert.strictEqual(photo({}, 'trailer').shape, 'square');
        assert.strictEqual(photo({ logo_url: 'https://cdn.test/logo.png' }, 'vendor', 'logo_url').url, 'https://cdn.test/logo.png');
    });

    test('icon, badge, badges, fact and relatedFact build the descriptor fragments', function (assert) {
        assert.deepEqual(icon('box'), { icon: 'box' });
        assert.deepEqual(icon('box', 'tile'), { icon: 'box', iconClass: 'tile' });

        assert.strictEqual(badge('plate', 'id-card', ''), null, 'a blank label is no badge');
        assert.deepEqual(badge('plate', 'id-card', 'ABC', { relatedId: 'v1' }), { key: 'plate', icon: 'id-card', label: 'ABC', relatedId: 'v1' });
        assert.deepEqual(badges(null, { key: 'a' }, undefined, { key: 'b' }), [{ key: 'a' }, { key: 'b' }]);

        assert.deepEqual(fact('phone', '123'), { labelKey: 'resource-summary.facts.phone', value: '123' });
        assert.deepEqual(fact('status', 'active', { format: 'humanize' }), { labelKey: 'resource-summary.facts.status', value: 'active', format: 'humanize' });
        assert.deepEqual(relatedFact('vehicle', undefined, 'vehicle'), { labelKey: 'resource-summary.facts.vehicle', related: null, relatedType: 'vehicle', value: null });
        const vehicle = {};
        assert.deepEqual(relatedFact('vehicle', vehicle, 'vehicle', 'Truck'), { labelKey: 'resource-summary.facts.vehicle', related: vehicle, relatedType: 'vehicle', value: 'Truck' });
    });

    test('dateLabel formats dates and strings and refuses anything else', function (assert) {
        assert.strictEqual(dateLabel(null), null);
        assert.strictEqual(dateLabel('not a date'), null);
        assert.strictEqual(dateLabel(new Date(2026, 0, 2, 3, 4)), '02 Jan 2026, 03:04');
        assert.strictEqual(dateLabel('2026-01-02T00:00:00', 'dd MMM yyyy'), '02 Jan 2026');
    });

    test('typeLabel reads a polymorphic type the way a person does', function (assert) {
        assert.strictEqual(typeLabel(''), null);
        assert.strictEqual(typeLabel('customer-fleet-ops:contact'), 'Customer');
        assert.strictEqual(typeLabel('facilitator_vendor'), 'Facilitator vendor');
        assert.strictEqual(typeLabel('fleet-ops:contact'), 'Contact', 'a bare extension prefix reads as the type after it');
        assert.strictEqual(typeLabel(':contact'), 'Contact');
        assert.strictEqual(typeLabel(':'), null, 'nothing readable on either side');
    });

    test('money and join leave out what is missing', function (assert) {
        assert.strictEqual(money(null, 'USD'), null);
        assert.strictEqual(money(10), '10');
        assert.strictEqual(money(10, 'USD'), '10 USD');
        assert.strictEqual(join([null, '', 'a', 'b']), 'a b');
        assert.strictEqual(join(['a', 'b'], ', '), 'a, b');
        assert.strictEqual(join([null]), null);
    });

    test('polymorphicType reads the related model name, its proxy, or the type attribute', function (assert) {
        class Customer {
            static modelName = 'contact';
        }

        assert.strictEqual(polymorphicType(null, 'customer', 'customer_type'), null);
        assert.strictEqual(polymorphicType({ customer: new Customer() }, 'customer', 'customer_type'), 'contact');
        assert.strictEqual(polymorphicType({ customer: { content: new Customer() } }, 'customer', 'customer_type'), 'contact');
        assert.strictEqual(polymorphicType({ customer: null, customer_type: 'vendor' }, 'customer', 'customer_type'), 'vendor');
        assert.strictEqual(polymorphicType({ customer: null }, 'customer'), null);
    });

    module('reaching the FleetOps engine', function () {
        test('extensionManager is found as its own service or through universe', function (assert) {
            const manager = {};

            assert.strictEqual(extensionManager({ lookup: () => null }), null);
            assert.strictEqual(extensionManager({ lookup: (name) => (name === 'service:universe/extension-manager' ? manager : null) }), manager);
            assert.strictEqual(extensionManager({ lookup: (name) => (name === 'service:universe' ? { extensionManager: manager } : null) }), manager);
            assert.strictEqual(
                extensionManager({
                    lookup: (name) =>
                        name === 'service:universe'
                            ? {
                                  get extensionManager() {
                                      throw new Error('no manager on this host');
                                  },
                              }
                            : null,
                }),
                null,
                'a universe whose manager lookup throws counts as no manager'
            );
        });

        test('engineInstalled is false without a manager, when not installed, or when the check throws', function (assert) {
            assert.false(engineInstalled({ lookup: () => null }));
            assert.false(engineInstalled({ lookup: () => ({ isInstalled: () => false }) }));
            assert.true(engineInstalled({ lookup: () => ({ isInstalled: (name) => name === FLEETOPS_ENGINE }) }));
            assert.true(engineInstalled({ lookup: () => ({ isInstalled: (name) => name === '@other/engine' }) }, '@other/engine'));
            assert.false(
                engineInstalled({
                    lookup: () => ({
                        isInstalled() {
                            throw new Error('boom');
                        },
                    }),
                })
            );
        });

        function ownerWithEngine(services, overrides = {}) {
            const engine = { lookup: (name) => services[name.replace('service:', '')] ?? null };
            const manager = { ensureEngineLoaded: async () => engine, ...overrides };

            return { lookup: (name) => (name === 'service:universe/extension-manager' ? manager : null) };
        }

        test('engineOpener prefers the panel, then the transition, and reports what it could not do', async function (assert) {
            const record = { id: 'r1' };
            const seen = [];
            const panelService = { panel: { view: (r) => seen.push(['panel', r]) }, transition: { view: (r) => seen.push(['transition', r]) } };
            const transitionService = { transition: { view: (r) => seen.push(['transition-only', r]) } };
            const bareService = {};

            assert.false(await engineOpener({ lookup: () => null }, 'driver-actions')(record), 'no manager');
            assert.false(await engineOpener(ownerWithEngine({ 'driver-actions': panelService }), 'driver-actions')(null), 'no record');
            assert.false(await engineOpener(ownerWithEngine({}), 'driver-actions')(record), 'no service');
            assert.false(await engineOpener(ownerWithEngine({ 'driver-actions': bareService }), 'driver-actions')(record), 'no view');
            assert.false(await engineOpener(ownerWithEngine({ 'driver-actions': panelService }, { ensureEngineLoaded: async () => null }), 'driver-actions')(record), 'no engine');
            assert.false(
                await engineOpener(
                    ownerWithEngine(
                        { 'driver-actions': panelService },
                        {
                            ensureEngineLoaded: async () => {
                                throw new Error('offline');
                            },
                        }
                    ),
                    'driver-actions'
                )(record),
                'the load failed'
            );

            assert.true(await engineOpener(ownerWithEngine({ 'driver-actions': panelService }), 'driver-actions')(record));
            assert.true(await engineOpener(ownerWithEngine({ 'driver-actions': transitionService }), 'driver-actions')(record), 'no panel means the transition');
            assert.true(await engineOpener(ownerWithEngine({ 'driver-actions': panelService }), 'driver-actions', { mode: 'transition' })(record));
            assert.false(await engineOpener(ownerWithEngine({ 'driver-actions': panelService }), 'driver-actions', { mode: 'modal' })(record), 'an unknown mode opens nothing');

            assert.deepEqual(seen, [
                ['panel', record],
                ['transition-only', record],
                ['transition', record],
            ]);
        });
    });
});
