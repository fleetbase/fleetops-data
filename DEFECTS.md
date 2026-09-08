# Defects and observations

Findings surfaced while bringing `@fleetbase/fleetops-data` to 100% test
coverage. Each entry says whether it was fixed in that campaign or only
recorded, and — where it was only recorded — the test that pins the current
behaviour so a future fix is a deliberate, visible change rather than a
surprise.

## Fixed

### 1. `MultiPoint` identified itself as a `MultiPolygon`

`addon/utils/geojson/multi-point.js` was a copy of `multi-polygon.js` with the
class renamed but not the type strings. The constructor tested for
`input.type === 'MultiPolygon'`, threw `GeoJSON: invalid input for new
MultiPolygon`, and stamped `this.type = 'MultiPolygon'`.

Two observable consequences:

- `geojsonCreatePrimitive({ type: 'MultiPoint', … })` **threw**, because the
  first branch never matched a real MultiPoint payload and a GeoJSON object is
  not an array, so it fell through to the error branch.
- Every `MultiPoint` built from a bare coordinate array mislabelled itself, so
  anything downstream that dispatches on `geometry.type` — `calculateBounds`,
  map renderers — treated it as a polygon.

Covered by `tests/unit/utils/geojson/multi-point-test.js`.

### 2. `new GeometryCollection(null)` threw a `TypeError`

`addon/utils/geojson/geometry-collection.js` reached `input.coordinates` without
first checking `input`, so invalid input produced
`Cannot read properties of null` instead of the intended
`GeoJSON: invalid input for new GeometryCollection`. Every sibling geometry
(`Point`, `LineString`, `Polygon`, `MultiPolygon`) guards with `input &&`.

Covered by `tests/unit/utils/geojson/geometry-collection-test.js`.

### 3. `order.pickupName` / `order.dropoffName` threw without `meta`

Both getters ended with `if (meta.pickup_is_driver_location === true)`, with no
guard. `meta` has no default, so any order lacking it — including one straight
from `store.createRecord('order')` in the order creation form — threw a
`TypeError` when the getter was read. The neighbouring `isPickupReady` in the
same file already used `this?.meta?.is_pickup`, so the omission was local rather
than deliberate.

Covered by `tests/unit/models/order-test.js`.

### 4. Unreachable Mercator branch in `Circle`

`applyConverter` in `addon/utils/geojson/circle.js` carried an
`if (converter === positionToMercator) { geojson.crs = MercatorCRS; }` branch.
Its only caller is `Circle.toGeographic`, which always passes
`positionToGeographic`, so the branch could never run. Removed along with the
now-redundant `noCrs` parameter; `MercatorCRS` is still exported from
`geo-json.js` for consumers.

### 5. Three models formatted dates without an `isValidDate` guard

`payload`, `integrated-vendor` and `service-rate` had `date-fns` getters that
called `formatDate` / `formatDistanceToNow` directly:

| Model | Unguarded getters |
| --- | --- |
| `payload` | `updatedAgo`, `updatedAt`, `updatedAtShort`, `createdAgo`, `createdAtShort` |
| `integrated-vendor` | `updatedAgo`, `updatedAt`, `createdAgo` |
| `service-rate` | `updatedAgo`, `updatedAt`, `updatedAtShort`, `createdAgo` |

About fifty sibling models guard the same getters and return `null`; these
threw `RangeError: Invalid time value` when the date was missing, so reading
them on an unsaved record crashed. Every getter now carries the same
`isValidDate` guard as its siblings and returns `null`. The `guarded: false`
escape hatch in `tests/helpers/model-contract.js` went with it: every date
getter in the addon now has to cope with a missing date.

Covered by the three models' unit tests through `assertDateGetters`.

### 6. `DriverSerializer.serializeBelongsTo` wrote an undefined vehicle id

```js
if (key === 'vehicle' && isArray(json[key])) {
    json[`${key}_uuid`] = get(json, `${key}.uuid`);
    return;
}
```

`get(array, 'uuid')` is `undefined` for an array, so this defensive path wrote
`vehicle_uuid: undefined` rather than an identifier. It also could not trigger
during a normal `record.serialize()`: `json.vehicle` is still unset when
`serializeBelongsTo` runs, because the embedded mixin populates it afterwards,
and nothing in the monorepo calls the hook directly.

The branch was deleted rather than repaired. Correcting the type test to
`isObject` would have left it just as unreachable, and nothing establishes
that an array-shaped `vehicle` was ever meant to be reduced to its first
element's uuid. The vehicle relationship is now always handed to the embedded
records mixin, which is what every real serialization did already.

Covered by `tests/unit/serializers/driver-test.js`.

### 8. `order`'s `@not` macros referenced getters that did not exist

```js
@not('hasTrackingNumber') missing_tracking_number;
@not('hasPurchaseRate') missing_purchase_rate;
@not('hasTrackingStatuses') missing_tracking_statuses;
@not('hasPayload') missing_payload;
```

The properties actually declared just above are `has_tracking_number`,
`has_purchase_rate`, `has_tracking_statuses` and `has_payload`. `@not` on an
undefined property yields `true`, so all four `missing_*` flags were permanently
`true` regardless of the order's state. Each macro now points at the snake_case
property that exists, so the flags are the inverse of the presence macros.

This flips four public flags from always-true to correct. No consumer in the
Fleetbase monorepo reads any of them, so nothing had adapted to the old values.

Covered by `tests/unit/models/order-test.js`.

### 9. `app/utils/geojson.js` re-exported a default that does not exist

The app-tree shim was `export { default } from '@fleetbase/fleetops-data/utils/geojson'`,
but the barrel declares only named exports, so the re-exported `default` was
`undefined`. Nothing resolved the barrel through the app tree, so the shim was
made to match the module it points at (`export * from …`) rather than deleted:
every other addon module keeps its app-tree shim, and this one now behaves
like them.

### 10. `ServiceRateSerializer` could not deduplicate per-drop or distance fee drafts

`normalizeSaveResponse` reconciles optimistically-created fee rows against what
the backend returned. The lookup map was built from the persisted fees, and
the key function short-circuited on `fee.id`, so every persisted key was
`id:<uuid>` while every draft key was a shape key (`drop:…` / `distance:…`).
The two could never match, so after saving a fixed-rate or per-drop service
rate the optimistic draft rows stayed alongside the rows the backend returned
and the editor showed duplicates until reload. Multi-zone rates were unaffected
because a separate clause replaces the whole multi-zone set.

Both sides are now keyed by fee shape alone. The `id:` identity was dropped
rather than kept: the map's values were never read, and an identity a draft
cannot have has no place in a comparison meant to match drafts. Two fees of
genuinely different shape still never collapse.

Covered by `tests/unit/serializers/service-rate-test.js`.

### 7. The relation loaders re-fetched records that were already in hand

`driver.loadVehicle()`, `driver.loadVendor()`, `fuelReport.loadVehicle()`,
`fuelReport.loadDriver()`, `issue.loadVehicle()` and `issue.loadDriver()` all
guarded their fetch with `isRelationMissing` from `@fleetbase/ember-core`:

```js
const isMissingRelation = isset(model, `${relation}_uuid`) && !isset(model, ``);
```

The second `isset` is passed an empty path, so it is always falsy and the
expression reduces to "the identifier attribute is set". The relationship itself
is never consulted, so every loader re-fetched on every call even when the
record was already loaded.

The six call sites now use this package's own
`addon/utils/is-relation-missing.js`, the exact negation of
`shouldNotLoadRelation`, which the order loaders already used. That predicate
now reads a declared relationship through its Ember Data reference rather than
the property itself: the driver's `vehicle` and `vendor` and the fuel report's
`vehicle` and `driver` are async, and an async relationship hands back a
promise proxy that is never blank, so a plain property check would have made
those loaders never fetch at all. Every relationship the order loaders check is
`async: false`, so their behaviour is unchanged.

A consumer will notice that these loaders now resolve from the loaded record
without a request when the relationship is already populated, and still fetch
when only the identifier is present.

**Still broken upstream.** `@fleetbase/ember-core/utils/is-relation-missing`
has not been changed; any other consumer of it still re-fetches on every call.
Fixing it there is out of scope for this repository.

Covered by `tests/unit/utils/is-relation-missing-test.js`,
`tests/unit/utils/should-not-load-relation-test.js` and the loader tests in
`tests/unit/models/{driver,fuel-report,issue}-test.js`.

### 11. `EntitySerializer.serializePolymorphicType` read before it checked

```js
let belongsTo = snapshot.belongsTo(key);
let type = belongsTo.modelName;   // ← threw here
…
if (!belongsTo) {
    json[key + '_type'] = null;   // ← never reached
}
```

`belongsTo.modelName` was read three lines before the null guard, so an unset
`customer` threw a `TypeError` rather than clearing the type. The read now
happens inside the else branch, exactly as the order, waypoint, maintenance and
work-order serializers already do, so an unset customer writes
`customer_type: null`. The branch is live, so its coverage exemption is gone.

Covered by `tests/unit/serializers/entity-test.js`.

### 12. Two order loaders repeated a check that had already returned

`loadPayload` treated an `existingPayload` whose `waypoints` was neither a
ManyArray nor a plain array as a reason to fetch. Ember Data always
materializes a hasMany as a ManyArray, so that branch, and the
`meta._index_resource` flag only it consulted, could never matter.
`loadCustomer` repeated `!this.customer_uuid || !isBlank(this.customer)` after
`shouldNotLoadRelation(this, 'customer')` had just returned `false` for exactly
those cases. Both guards were deleted. `loadPayload` now reuses an existing
payload unless its waypoints were counted but never loaded, which was the one
case that ever forced a refetch.

Covered by `tests/unit/models/order-test.js`.

### 13. `payload.orderWaypoints` guarded against an unsettable relationship

The fallback returned `this.waypoints` when it had no `toArray`. Ember Data
refuses `payload.set('waypoints', null)` with *"You must pass an array of records
to set a hasMany relationship"*, so the relationship is always a ManyArray. The
getter now returns `this.waypoints.toArray()` and nothing else.

Covered by `tests/unit/models/payload-test.js`.

### 14. `service-rate` fee ranking and `?? []` fallbacks

`rankFee` returned `2` for a fee that was neither new nor had an id, which an
Ember Data record cannot be (it is either unsaved with no id, or loaded with
one), and the function was copied three times. It is now a single module-level
helper with two ranks: a persisted fee outranks a draft. The six
`(this.rate_fees?.toArray?.() ?? [])` fallbacks guarded against a hasMany with
no `toArray`, which never happens; they are plain `toArray()` calls now.

Covered by `tests/unit/models/service-rate-test.js`.

### 15. `DeviceSerializer` guarded against a missing inherited hook

`if (typeof super.serializePolymorphicType === 'function')` could never be
false: `super` resolves lexically against the class prototype chain, and
`JSONSerializer` always provides the method, so the `return;` below it could
not run. The guard is gone and the inherited hook is called directly. The test
that deleted the method from the owning prototype to reach the guard went with
it.

Covered by `tests/unit/serializers/device-test.js`.

---

## How coverage exemptions are enforced

`scripts/unreachable-code.js` is the one place code can be exempted from the
coverage gate, and it is empty: every clause that was once listed there was
either made reachable by reordering (§11) or deleted outright (§12–§15). The
mechanism stays so that a future guard which is provably unreachable *and*
cannot be deleted has a documented home. `pnpm run coverage:check` reads the
list and:

- counts those specific locations as covered, so the gate can demand 100%;
- **fails** if a listed location turns out to be covered, so a fix forces the
  exemption to be removed;
- **fails** if a listed file is missing from the report entirely;
- prints every exemption with its reason on each run, so none of them is silent.

Exemptions are per-location, never per-file and never per-directory. Nothing
else in the addon is excluded from coverage, and every entry must have a
matching section in this document explaining why the code could not be removed.

---

## Unrelated discrepancy noticed in passing — fixed

`README.md` stated the project was licensed under the MIT License, while
`package.json` declares `AGPL-3.0-or-later` and `LICENSE.md` contains the GNU
Affero General Public License v3 text. The README was the only wrong reference
and now names the AGPL, matching the licence the project actually ships under.
