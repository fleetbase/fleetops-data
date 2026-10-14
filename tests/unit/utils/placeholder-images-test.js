import { module, test } from 'qunit';
import ENV from 'dummy/config/environment';
import getPlaceholderImage, { PLACEHOLDER_IMAGES, isDefaultImage, resolveResourceImage } from '@fleetbase/fleetops-data/utils/placeholder-images';

const INLINE = 'data:image/svg+xml;base64,PHN2Zy8+';

module('Unit | Utility | placeholder-images', function (hooks) {
    let defaultValues;

    hooks.beforeEach(function () {
        defaultValues = ENV.defaultValues;
        ENV.defaultValues = { ...defaultValues };
    });

    hooks.afterEach(function () {
        ENV.defaultValues = defaultValues;
    });

    test('it ships one inline SVG silhouette per resource type', function (assert) {
        for (const type of ['trailer', 'vehicle', 'driver', 'fleet', 'vendor', 'contact', 'customer']) {
            assert.ok(PLACEHOLDER_IMAGES[type].startsWith('data:image/svg+xml;base64,'), `${type} placeholder is an inline data URI`);
            assert.ok(atob(PLACEHOLDER_IMAGES[type].split(',')[1]).includes('<svg'), `${type} payload decodes to SVG markup`);
            assert.strictEqual(getPlaceholderImage(type), PLACEHOLDER_IMAGES[type]);
        }

        assert.strictEqual(getPlaceholderImage(), PLACEHOLDER_IMAGES.contact, 'no type means the generic silhouette');
        assert.strictEqual(getPlaceholderImage('unknown'), PLACEHOLDER_IMAGES.contact, 'unknown types fall back to the generic silhouette');
    });

    test('a console may override a silhouette through its configuration', function (assert) {
        ENV.defaultValues.placeholders = { driver: INLINE };
        assert.strictEqual(getPlaceholderImage('driver'), INLINE, 'defaultValues.placeholders.<type> wins');

        delete ENV.defaultValues.placeholders;
        ENV.defaultValues.vehicleImage = INLINE;
        assert.strictEqual(getPlaceholderImage('vehicle'), INLINE, 'an inline defaultValues.<type>Image wins');

        assert.strictEqual(getPlaceholderImage('vendor'), PLACEHOLDER_IMAGES.vendor, 'a hosted defaultValues.<type>Image is ignored');

        delete ENV.defaultValues;
        assert.strictEqual(getPlaceholderImage('driver'), PLACEHOLDER_IMAGES.driver, 'no defaultValues at all is fine');
    });

    test('it treats blank photos, the legacy hosted defaults and the configured defaults as "no photo"', function (assert) {
        assert.true(isDefaultImage(undefined));
        assert.true(isDefaultImage(''));
        assert.true(isDefaultImage(42));
        assert.true(isDefaultImage('https://s3.ap-southeast-1.amazonaws.com/flb-assets/static/no-avatar.png'));
        assert.true(isDefaultImage('https://s3.ap-southeast-1.amazonaws.com/flb-assets/static/vehicle-placeholder.png'));
        assert.true(isDefaultImage('https://flb-assets.s3.ap-southeast-1.amazonaws.com/static/image-file-icon.png'));
        assert.true(isDefaultImage(ENV.defaultValues.driverImage), 'the console default is not a real photo');
        assert.false(isDefaultImage('https://cdn.example/uploads/truck-42.jpg'));

        delete ENV.defaultValues;
        assert.false(isDefaultImage('https://cdn.example/uploads/truck-42.jpg'), 'no defaultValues at all is fine');
    });

    test('it resolves a record image to its own photo or the typed placeholder', function (assert) {
        assert.strictEqual(resolveResourceImage('https://cdn.example/uploads/truck-42.jpg', 'vehicle'), 'https://cdn.example/uploads/truck-42.jpg');
        assert.strictEqual(resolveResourceImage('https://s3.ap-southeast-1.amazonaws.com/flb-assets/static/no-avatar.png', 'driver'), PLACEHOLDER_IMAGES.driver);
        assert.strictEqual(resolveResourceImage(null, 'customer'), PLACEHOLDER_IMAGES.customer);
    });
});
