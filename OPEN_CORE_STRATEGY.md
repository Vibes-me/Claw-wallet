# Open Core Strategy

## Purpose
Claw Wallet follows an **open-core** model to keep the wallet SDK/client and self-hosted runtime broadly accessible, while funding long-term maintenance through managed and enterprise offerings.

This document defines the product boundary so contributors, customers, and maintainers can clearly understand what is open source versus paid.

## Open Source (Core)
The following are intended to remain open source in this repository:

1. **Core wallet SDKs and API clients**
   - JavaScript and Python clients used to integrate agent wallets.
2. **Core wallet service runtime**
   - Wallet creation, transaction execution, identity, and baseline policy features.
3. **Basic self-host deployment**
   - Local Docker/self-hosted deployment artifacts needed to run Claw Wallet independently.
4. **Developer documentation and examples**
   - Getting started docs, API docs, and sample integrations.

### Open source guarantees
- Open source core remains usable without subscribing to managed cloud.
- Core API behavior is versioned and documented.
- Security fixes for core components are prioritized.

## Paid / Closed Components
The following capabilities are reserved for commercial offerings and are not guaranteed to be shipped in this repository.

### 1) Managed cloud control plane
Examples include:
- Multi-tenant hosted provisioning and lifecycle management.
- Managed key operations and operational controls beyond base self-host functionality.
- Hosted admin experiences for organization/account management.

### 2) Enterprise policy and compliance modules
Examples include:
- Advanced policy packs for regulated environments.
- Compliance workflows (e.g., approvals, evidence retention, segregation-of-duty tooling).
- Organization-level governance controls that extend beyond baseline OSS policy features.

### 3) SLA, analytics, and hosted governance
Examples include:
- Contractual uptime/SLA commitments and premium support workflows.
- Advanced analytics, observability dashboards, and usage intelligence.
- Hosted governance controls and enterprise reporting.

## Decision Rules for Feature Placement
When deciding where a new feature belongs:

- **Core if** it is necessary for developer adoption, local testing, or baseline production self-hosting.
- **Commercial if** it primarily addresses hosted operations at scale, enterprise compliance obligations, or contractual service commitments.
- **Shared interface** patterns are preferred: APIs/SDKs should remain stable so OSS and paid layers integrate cleanly.

## Contribution Expectations
- Community contributions to core are welcome via normal PR workflow.
- Commercial-only modules may be developed in private repositories.
- If a contribution touches a boundary area, maintainers will label it as **core** or **commercial extension** during review.

## Roadmap Transparency
- Public roadmap items focus on OSS core capabilities.
- Commercial roadmap items may be summarized at a category level (without implementation details) so users can plan adoption.

## Licensing
Open source core in this repository is licensed under the root `LICENSE` file. Commercial offerings may use separate commercial terms.
