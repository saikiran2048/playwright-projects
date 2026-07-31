# test-data

Static JSON/YAML fixtures for fixed reference data (not dynamically generated per test).

Empty as of Stage 6 — everything built so far (customer name/email/phone) is
dynamically generated via `utils/CustomerDataBuilder.ts`, since none of it needs
to be a fixed value. This folder is for genuinely fixed reference data (e.g. a
known category/city list for a filter test) — will populate once a test
actually needs one, not before.