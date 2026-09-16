> v0.2.1 ~ "Inspection display dates"

---
## Highlights

- **Inspection display dates are formatted** — `inspection-form` and `inspection-submission` format their display-date getters as `yyyy-MM-dd HH:mm` and answer `null` for a date they cannot read, the way every other model in this package does. The console's inspection indexes were showing a raw datetime instance string.
- **`frequency` is gone from `inspection-form`** — nothing scheduled an inspection from it, and it is being dropped from the FleetOps API resource, report schema and console in fleetbase/fleetops#319.

The underscored attributes (`created_at`, `published_at`, …) are untouched, so anything needing a real `Date` is unaffected.

---
## Need help?
- [GitHub Discussions](https://github.com/fleetbase/fleetbase/discussions)
- [Discord](https://discord.gg/HnTqQ6zAVn)
