# Story 6.2: Demo Reset Baseline

Status: done

## Completion Notes

- Added deterministic reset command: `node ace demo:reset`.
- Reset truncates demo-related tables and reseeds baseline deterministically.
- Reset process is documented in backend README and repeatable in one command.

## File List

- `/Users/angelserrano/development/scholarfi-back/commands/demo_reset.ts`
- `/Users/angelserrano/development/scholarfi-back/app/services/demo_seed_service.ts`
- `/Users/angelserrano/development/scholarfi-back/README.md`
