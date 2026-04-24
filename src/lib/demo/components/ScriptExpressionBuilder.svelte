<script lang="ts">
  import type { WorkbenchScriptExpression, WorkbenchScriptField } from "$lib/chartx/public/workbench-scripts";

  type BuilderPathSegment = "input" | "left" | "right";

  export let expression: WorkbenchScriptExpression;
  export let path: readonly BuilderPathSegment[] = [];
  export let onSetKind: (path: readonly BuilderPathSegment[], kind: WorkbenchScriptExpression["kind"]) => void;
  export let onSetField: (path: readonly BuilderPathSegment[], field: WorkbenchScriptField) => void;

  const FIELD_OPTIONS: readonly WorkbenchScriptField[] = ["open", "high", "low", "close", "hl2", "hlc3"];

  function pathKey(pathValue: readonly BuilderPathSegment[]): string {
    return pathValue.length === 0 ? "root" : pathValue.join(".");
  }
</script>

<div class="script-builder-node" data-custom-script-builder={pathKey(path)}>
  <label class="script-input-field compact-builder-field">
    <span>{path.length === 0 ? "Root node" : pathKey(path)}</span>
    <select
      value={expression.kind}
      data-custom-script-node-kind={pathKey(path)}
      on:change={(event) =>
        onSetKind(path, (event.currentTarget as HTMLSelectElement).value as WorkbenchScriptExpression["kind"])}
    >
      <option value="input">Field</option>
      <option value="sma">SMA</option>
      <option value="subtract">Subtract</option>
    </select>
  </label>

  {#if expression.kind === "input"}
    <label class="script-input-field compact-builder-field">
      <span>Field</span>
      <select
        value={expression.field}
        data-custom-script-node-field={pathKey(path)}
        on:change={(event) =>
          onSetField(path, (event.currentTarget as HTMLSelectElement).value as WorkbenchScriptField)}
      >
        {#each FIELD_OPTIONS as field}
          <option value={field}>{field}</option>
        {/each}
      </select>
    </label>
  {:else if expression.kind === "sma"}
    <p class="custom-script-preview">Uses the shared `length` input.</p>
    <svelte:self
      expression={expression.input}
      path={[...path, "input"]}
      {onSetKind}
      {onSetField}
    />
  {:else}
    <div class="script-builder-branch">
      <div>
        <p class="custom-script-preview">Left operand</p>
        <svelte:self
          expression={expression.left}
          path={[...path, "left"]}
          {onSetKind}
          {onSetField}
        />
      </div>
      <div>
        <p class="custom-script-preview">Right operand</p>
        <svelte:self
          expression={expression.right}
          path={[...path, "right"]}
          {onSetKind}
          {onSetField}
        />
      </div>
    </div>
  {/if}
</div>
