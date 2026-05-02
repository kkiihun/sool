# data

Use this folder for shared datasets that belong to the project but are not runtime build artifacts.

Suggested layout:

- `data/raw/` original source files
- `data/processed/` cleaned datasets used by scripts
- `data/tmp/` temporary working files that should not be committed

Keep large generated exports out of this folder. Put those in `exports/`.
