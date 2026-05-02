# Migration From `D:\Development\sool`

This document defines what should be reviewed and moved from the old working copy at:

- `D:\Development\sool`

into the primary repository at:

- `D:\sool`

## Decision

- Primary repository: `D:\sool`
- Old working copy: `D:\Development\sool`
- Do not sync the two directories blindly.
- Move code by review and patch, not by full folder copy.

## 1. High-Priority Code To Review

These changes exist in the old working copy and should be reviewed first because they affect runtime behavior or build stability.

- `backend/app/api/sense.py`
- `backend/app/api/tasting.py`
- `backend/app/api/tasting_note.py`
- `backend/app/core/security.py`
- `backend/app/models/tasting_note.py`
- `backend/app/schemas/review_schema.py`
- `backend/app/schemas/tasting_schema.py`
- `backend/requirements.txt`
- `docker-compose.yml`
- `frontend/app/admin/tasting/edit/[id]/page.tsx`
- `frontend/app/admin/tasting/list/page.tsx`
- `frontend/app/admin/tasting/new/page.tsx`
- `frontend/app/admin/tasting/view/[id]/page.tsx`
- `frontend/app/page.tsx`
- `frontend/app/sense/list/page.tsx`
- `frontend/app/sense/new/page.tsx`
- `frontend/app/sool/[id]/page.tsx`
- `frontend/app/updates/new/page.tsx`
- `frontend/app/updates/page.tsx`
- `frontend/components/SliderInput.tsx`
- `frontend/next.config.ts`
- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/scripts/next-with-filter.mjs`
- `frontend/.dockerignore`
- `frontend/Dockerfile`

## 2. Data And Analysis Files To Move

These are not app code. They should not live in the repository root. Move them into the new structure.

Move to `exports/`:

- `columns.tsv`
- `fks.tsv`
- `indexes.tsv`
- `commits.csv`
- `commits_utf8_sool.csv`
- `sool_schema_snapshot.txt`

Move to a dated export folder such as `exports/schema-audit/`:

- `all/tables.tsv`
- `all/columns_all.tsv`
- `all/indexes_all.tsv`
- `all/fks_all.tsv`

Recommended target layout:

```text
exports/
  schema-audit/
    tables.tsv
    columns_all.tsv
    indexes_all.tsv
    fks_all.tsv
    columns.tsv
    fks.tsv
    indexes.tsv
    sool_schema_snapshot.txt
  commit-audit/
    commits.csv
    commits_utf8_sool.csv
```

## 3. Files That Should Not Be Migrated

Do not move these from the old working copy.

- `backend/.venv/`
- `frontend/.next/`
- `frontend/node_modules/`
- `__pycache__/`
- `*.pyc`
- local logs

## 4. Files Already Better In `D:\sool`

Prefer the versions already in `D:\sool` for these areas unless a specific diff is intentionally ported.

- authentication flow
- app shell / shared header
- login/signup/profile pages
- API proxy routes
- Docker-first `.env`
- `main` branch history and remote tracking

Examples already present in `D:\sool`:

- `frontend/app/admin/page.tsx`
- `frontend/app/login/page.tsx`
- `frontend/app/signup/page.tsx`
- `frontend/app/profile/page.tsx`
- `frontend/app/api/proxy/[...path]/route.ts`
- `frontend/app/components/AppShellClient.tsx`
- `frontend/lib/auth.ts`

## 5. Safe Migration Order

1. Port the high-priority code files as reviewed patches into `D:\sool`.
2. Rebuild Docker and verify frontend/backend start.
3. Move analysis and export files into `exports/`.
4. Keep `D:\Development\sool` as read-only backup until verification is complete.
5. Delete or archive `D:\Development\sool` after the new repo is stable.

## 6. Suggested Commands

Create export folders:

```powershell
New-Item -ItemType Directory -Force D:\sool\exports\schema-audit
New-Item -ItemType Directory -Force D:\sool\exports\commit-audit
```

Copy non-code audit files:

```powershell
Copy-Item D:\Development\sool\columns.tsv D:\sool\exports\schema-audit\
Copy-Item D:\Development\sool\fks.tsv D:\sool\exports\schema-audit\
Copy-Item D:\Development\sool\indexes.tsv D:\sool\exports\schema-audit\
Copy-Item D:\Development\sool\sool_schema_snapshot.txt D:\sool\exports\schema-audit\
Copy-Item D:\Development\sool\all\*.tsv D:\sool\exports\schema-audit\
Copy-Item D:\Development\sool\commits.csv D:\sool\exports\commit-audit\
Copy-Item D:\Development\sool\commits_utf8_sool.csv D:\sool\exports\commit-audit\
```

## 7. Current Recommendation

Do not merge the whole old directory.

Use `D:\sool` as the only active repository and migrate:

- reviewed code diffs
- analysis outputs
- any missing one-off scripts that are still useful
