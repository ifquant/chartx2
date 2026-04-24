# 0306 add script library stale edit target fence v0

## Why

The Script Library editor can load an existing saved script for update, while
the saved library is managed by row actions and layout/import state outside the
form itself. A small guard is needed so the editor does not keep a stale
`editingCustomScriptId` after the corresponding saved script disappears.

## What changed

- documented the next workbench-owned fence for stale custom-script edit targets
- specified that the editor should reset to create mode when its edited script
  is no longer present in the saved library
- kept the slice scoped away from runtime execution, layout schema, and
  persisted draft recovery

## Verification

- not run (docs-only planning slice)

## Not included

- no code or test changes in this docs-only slice
- no undo flow for deleted custom scripts
- no custom-script schema or runtime execution changes
