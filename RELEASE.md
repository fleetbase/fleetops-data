> v0.2.3 ~ "Shared resource identity descriptors, and customer places that load"

---
## Highlights

- **Shared resource identity descriptors.** The identity descriptors for `driver`, `vehicle`, `customer`, `contact`, `place`, `order`, `vendor` and `fleet` now live in this package, so any extension that depends on it renders those records as identity cells, pills and summaries without loading the Fleet-Ops engine. `utils/resource-descriptors/shared` builds them, `utils/resource-descriptors/helpers` holds the building blocks, and `utils/placeholder-images` is the styled placeholder set. The thin `<Key::Pill>`, `<Key::Summary>`, `<Cell::KeyIdentity>` and `<SelectOption::Key>` wrappers for those eight keys ship as app-tree templates, so they resolve inside every consumer. An instance initializer registers the descriptors with ember-ui's resource registry on every host and engine boot, filling in only keys nobody has registered; Fleet-Ops replaces them with its own openers when it boots. ([#86](https://github.com/fleetbase/fleetops-data/pull/86))
- **Records open on their Fleet-Ops page outside Fleet-Ops.** Opening a resource loads the Fleet-Ops engine on demand. Inside its routes the record's context panel opens; from any other engine the record opens on its Fleet-Ops page, since the panel's components only Fleet-Ops can render. ([#88](https://github.com/fleetbase/fleetops-data/pull/88))
- **Identity stub builder.** `utils/identity-stub` (`buildIdentityStub`) moves here from Fleet-Ops, so an extension can build a stand-in record for a relation a row only knows by name. `typeLabel('fleet-ops:contact')` reads "Contact", and a host without an extension manager no longer throws from `canOpen`. ([#87](https://github.com/fleetbase/fleetops-data/pull/87))
- **An order's customer loads with its saved places.** Customer contacts and customer vendors now have their own serializers, so their embedded `place` and `places` load as `place` records. Before, a place with a type such as "apartment" or "house" was read as a model name, and the order failed to load with "No model was found for 'apartment'".

---
## Upgrading
The shared descriptors register with the `resource-registry` service from fleetbase/ember-ui v0.4.5 or later. fleetbase/fleetops v0.6.72 builds its own driver, vehicle, customer, contact, place, order, vendor and fleet descriptors from these and re-exports the moved helpers, so an older Fleet-Ops keeps working on its own copies.

---
## Need help?
- [GitHub Discussions](https://github.com/fleetbase/fleetbase/discussions)
- [Discord](https://discord.gg/HnTqQ6zAVn)
---
