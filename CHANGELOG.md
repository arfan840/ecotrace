# Changelog

All notable changes to the EcoTrace Biomedical Waste Management project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-30

### Added
- Created data access modules for hospitals, routes, bags, audit logs, batches, discrepancies, dashboards, and reports to separate rendering from network logic.
- Expanded Vitest unit testing to cover hospitals, routes, bags, and schema validation.
- Enforced a CI/CD build gate checking code coverage (60% Statements/Functions/Lines, 50% Branches).
- Added local development postgres-based `docker-compose.yml` database bootstrapper.
- Implemented structured JSON error logging format for improved cloud observability.
- Created Dependabot weekly dependency updates tracking configuration.
- Added `CONTRIBUTING.md` developer guide and onboarding instructions.

### Fixed
- Extracted direct Supabase `.from()` database operations out of page components.
- Resolved and replaced raw browser `console.error` calls across component pages with structured `logError` framework.
- Restructured driver HCF bed limits scan prevention rules into dedicated business rules engine with testing.
