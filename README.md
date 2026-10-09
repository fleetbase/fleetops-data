# @fleetbase/fleetops-data

[![codecov](https://codecov.io/gh/fleetbase/fleetops-data/graph/badge.svg)](https://codecov.io/gh/fleetbase/fleetops-data)

[Short description of the addon.]


## Compatibility

* Ember.js v4.8 or above
* Ember CLI v4.8 or above
* Node.js v18 or above


## Installation

```
ember install @fleetbase/fleetops-data
```


## Usage

Install the addon and the Fleet-Ops models, adapters, serializers and transforms are available to the host application and to every engine that lists it as a dependency.

### Shared resource descriptors

The addon also ships the resource identity descriptors for the resources every extension can see through its models: `driver`, `vehicle`, `customer`, `contact`, `place`, `order`, `vendor` and `fleet`, along with the thin `<Key::Pill>`, `<Key::Summary>`, `<Cell::KeyIdentity>` and `<SelectOption::Key>` wrappers that name the resource type for the generic components in `@fleetbase/ember-ui`.

An instance initializer registers the descriptors with the `resource-registry` service whenever the host or an engine boots, filling in only the keys nobody has registered yet. That means a Storefront or Ledger table can render a driver as an identity cell before the Fleet-Ops engine has loaded:

```js
{
    id: 'driver-assigned',
    cellComponent: 'table/cell/identity',
    resourceType: 'driver',
    resourcePath: 'driver_assigned',
}
```

Opening a resource loads the Fleet-Ops engine on demand and hands the record to its action service, so the engine bundle is only fetched when someone clicks. When Fleet-Ops itself boots it replaces these descriptors with its own, which open the same panels directly.

The helpers behind the descriptors and the styled placeholder images are exported from `@fleetbase/fleetops-data/utils/resource-descriptors` and `@fleetbase/fleetops-data/utils/placeholder-images` for other packages that build descriptors.


## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.


## License

This project is licensed under the [GNU Affero General Public License v3.0 or later](LICENSE.md) (`AGPL-3.0-or-later`).
