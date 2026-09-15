// Test stub for the `server-only` package.
//
// The real package throws when imported outside a React Server Component
// graph. Vitest aliases it to this empty module so the test suite can import
// the production server modules (caseStore, accusationResult, ...) directly
// instead of re-implementing their logic.
export {};
