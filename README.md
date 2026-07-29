# EventHub — Playwright Automation Framework

A Playwright + TypeScript test automation framework built against [EventHub](https://eventhub.rahulshettyacademy.com), an event ticket booking platform (Next.js frontend, Express/Prisma backend).

This repo is being built stage by stage — each stage adds one framework concern (config, page objects, fixtures, test data, auth, API+UI hybrid tests, CI, etc.) rather than scaffolding everything at once. See [Roadmap](#roadmap) below for where things stand.

## Stack

- **Test runner**: `@playwright/test`
- **Language**: TypeScript
- **Target app**: `https://eventhub.rahulshettyacademy.com`
- **API**: `https://api.eventhub.rahulshettyacademy.com/api`

## Getting started

```bash
# install dependencies
npm install

# install browser binaries (one-time)
npx playwright install

# copy env template and fill in test credentials
cp .env.example .env
```

## Running tests

```bash
npm test              # run full suite headless
npm run test:headed   # run with a visible browser
npm run test:ui       # Playwright UI mode (interactive, time-travel debugging)
npm run test:debug    # step-through debugger
npm run report        # open the last HTML report
```

## Project structure

```
eventhub-framework/
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── package-lock.json
├── playwright.config.ts
├── tsconfig.json
├── config/
│   └── README.md
├── fixtures/
│   └── README.md
├── pages/
│   ├── README.md
│   └── components/
│       └── README.md
├── test-data/
│   └── README.md
├── tests/
│   ├── api/
│   │   └── README.md
│   └── e2e/
│       └── README.md
└── utils/
    └── README.md
```

*(folders are added as each stage is built — this list will grow)*

## Environment variables

See `.env.example`. Copy it to `.env` (gitignored) and fill in real values — never commit credentials.

## Roadmap

- [x] Stage 0 — Project setup & tooling
- [x] Stage 1 — Config layer (`playwright.config.ts`)
- [x] Stage 2 — Folder structure
- [x] Stage 3 — Page Object Model
- [ ] Stage 4 — Component objects & composition
- [ ] Stage 5 — Fixtures & dependency injection
- [ ] Stage 6 — Test data strategy
- [ ] Stage 7 — Environment management
- [ ] Stage 8 — Authentication & session management
- [ ] Stage 9 — API + UI hybrid testing
- [ ] Stage 10 — Debugging artifacts (screenshots/video/trace)
- [ ] Stage 11 — Parallelism & cross-browser execution
- [ ] Stage 12 — Reporting
- [ ] Stage 13 — Flaky-test handling & CI/CD
