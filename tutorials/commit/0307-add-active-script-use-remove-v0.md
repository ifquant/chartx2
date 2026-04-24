# 0307 add active script use remove v0

## Why

The Script Library can now show and fence saved scripts that are active on the
chart, but the user still needs a local way to clear that active use from the
workbench. The next slice should remove the mounted scripted indicator instance
from the active indicator list while preserving the saved custom-script
definition.

## What changed

- documented the next workbench-owned active scripted-indicator remove slice
- scoped the behavior to clearing active uses and unlocking library edit/delete
  fences
- kept saved script definitions, expression parsing, and chart-state
  persistence out of scope

## Verification

- not run (docs-only planning slice)

## Not included

- no code or test changes in this docs-only slice
- no deletion of saved custom-script definitions
- no chart-state-native scripted study persistence
