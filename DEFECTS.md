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

## Recorded, not fixed

### 7. `isRelationMissing` (upstream, `@fleetbase/ember-core`) ignores the relation

```js
const isMissingRelation = isset(model, `${relation}_uuid`) && !isset(model, ``);
```

The second `isset` is passed an empty path, so it is always falsy and the
expression reduces to "the identifier attribute is set". The relationship itself
is never consulted, so `driver.loadVehicle()`, `fuelReport.loadDriver()` and the
other loaders that use it re-fetch on every call even when the record is already
in hand.

This lives in `@fleetbase/ember-core`, not this package. The Fleet-Ops tests pin
the resulting behaviour so a fix upstream shows up here as a failing
expectation rather than silently changing request volume.

### 10. `ServiceRateSerializer` cannot deduplicate per-drop or distance fee drafts

`normalizeSaveResponse` reconciles optimistically-created fee rows against what
the backend returned, keyed by `savedFeeKey`:

```js
const savedFeeKey = (fee) => {
    if (fee.id) { return `id:${fee.id}`; }
    if (fee.unit === 'waypoint') { return `drop:${fee.min}:${fee.max}:${fee.unit}`; }
    if (fee.unit === 'multi_zone_distance') { return `multi-zone:…`; }
    return `distance:${fee.distance}`;
};
```

The lookup map is built from `savedRateFees` — records that are not `isNew`, and
therefore always have an `id`. Every saved key is thus `id:<uuid>`, while every
draft key is a shape key (`drop:…` or `distance:…`). The two can never match, so
`savedByKey.has(savedFeeKey(fee))` is always false and only the separate
`hasSavedMultiZoneFees` clause ever removes anything.

The practical effect: after saving a fixed-rate or per-drop service rate, the
optimistic draft rows stay alongside the rows the backend returned, so the editor
shows duplicates until the page is reloaded. Multi-zone rates are unaffected.

Not fixed: the correct key depends on what the backend guarantees about fee
identity across a save, which is not established anywhere in this repository.
`tests/unit/serializers/service-rate-test.js` pins the current behaviour with the
duplicates left in place.

## Unreachable defensive code

These are listed in `scripts/unreachable-code.js`, which the coverage gate reads.
The gate counts them as covered **and fails if any of them becomes reachable**,
so the list cannot outlive its cause. None of them is a behavioural bug today;
each is a guard that can never fire.

### 11. `EntitySerializer.serializePolymorphicType` reads before it checks

```js
let belongsTo = snapshot.belongsTo(key);
let type = belongsTo.modelName;   // ← throws here
…
if (!belongsTo) {
    json[key + '_type'] = null;   // ← never reached
}
```

`belongsTo.modelName` is read three lines before the null guard, so an unset
`customer` throws a `TypeError` rather than clearing the type. Every sibling
serializer (order, waypoint, maintenance, work-order) reads `modelName` inside
the else branch and handles the null correctly.

Moving the read below the guard is a one-line fix, but it changes a throw into a
`null`, which is a behaviour change for anything currently relying on the throw
to surface a mis-built snapshot. `tests/unit/serializers/entity-test.js` asserts
the throw.

### 12. Two order loaders repeat a check that already returned

`loadPayload` line 492 requires an `existingPayload` whose `waypoints` is neither
a ManyArray nor a plain array. Ember Data always materializes a hasMany as a
ManyArray, so the condition cannot hold.

`loadCustomer` line 517 is `if (!this.customer_uuid || !isBlank(this.customer))`,
but `shouldNotLoadRelation(this, 'customer')` on the line above already returns
`true` for exactly those two cases. Reaching line 517 means both operands are
false.

### 13. `payload.orderWaypoints` guards against an unsettable relationship

The fallback returns `this.waypoints` when it has no `toArray`. Ember Data
refuses `payload.set('waypoints', null)` with *"You must pass an array of records
to set a hasMany relationship"*, so the relationship is always a ManyArray.

### 14. `service-rate` fee ranking and `?? []` fallbacks

`rankFee` returns `2` for a fee that is neither new nor has an id. An Ember Data
record is either unsaved (no id, `isNew`) or loaded (has an id, not `isNew`), so
the middle rank is unreachable in all three copies of the function.

The `(this.rate_fees?.toArray?.() ?? [])` fallbacks likewise guard against a
hasMany with no `toArray`, which cannot occur.

### 15. `DeviceSerializer` guards against a missing inherited hook

`if (typeof super.serializePolymorphicType === 'function')` — `super` resolves
lexically against the class prototype chain, and `JSONSerializer` always provides
the method, so the `return;` below it cannot run. The test deletes the method
from the prototype that owns it to prove the branch behaves as intended, but
Istanbul attributes that execution elsewhere.

---

## How the exemptions are enforced

`scripts/unreachable-code.js` lists each unreachable location by its exact
Istanbul identity. `pnpm run coverage:check` reads that list and:

- counts those specific locations as covered, so the gate can demand 100%;
- **fails** if a listed location turns out to be covered, so a fix upstream
  forces the exemption to be removed;
- **fails** if a listed file is missing from the report entirely;
- prints every exemption with its reason on each run, so none of them is silent.

The exemptions are per-location, never per-file and never per-directory. Nothing
else in the addon is excluded from coverage.

---

## Unrelated discrepancy noticed in passing — fixed

`README.md` stated the project was licensed under the MIT License, while
`package.json` declares `AGPL-3.0-or-later` and `LICENSE.md` contains the GNU
Affero General Public License v3 text. The README was the only wrong reference
and now names the AGPL, matching the licence the project actually ships under.
