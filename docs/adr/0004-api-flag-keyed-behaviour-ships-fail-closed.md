---
status: accepted
---

# API-flag-keyed behaviour ships fail-closed, backend first

When a client feature keys off a new field in an API payload (first case: the Join Prompt and the change-gym support line keying off `partner.is_house`), the field can be missing at runtime: cached payloads predate it, and the app release can reach users before the backend release does. We decided such behaviour always reads the field fail-closed — `undefined` means "off", never a guess, enforced in a pure decision module with a test for the `undefined` case — and the backend change must be on production `main` before the app build or OTA update that reads it ships. Fail-closed makes mis-ordering safe (the feature is silently inert, never wrong), but the shipping order is still the rule, not optional: an inert feature in testers' hands wastes a release cycle.
