> v0.2.3 ~ "Customer places load"

---
## Highlights

- **An order's customer loads with its saved places.** Customer contacts and customer vendors now have their own serializers, so their embedded `place` and `places` load as `place` records. Before, a place with a type such as "apartment" or "house" was read as a model name, and the order failed to load with "No model was found for 'apartment'".

---
## Need help?
- [GitHub Discussions](https://github.com/fleetbase/fleetbase/discussions)
- [Discord](https://discord.gg/HnTqQ6zAVn)
