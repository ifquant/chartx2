<script lang="ts">
  import type {
    PhaseOneDrawingPropertyField,
    PhaseOneDrawingPropertyFieldSchema,
  } from "../public/market";
  import type { WorkbenchDrawingInspectorModel } from "../public/workbench-drawing-inspector";

  export let selectedDrawing: WorkbenchDrawingInspectorModel = null;
  export let activeDrawingTool = "none";
  export let pendingTrendLineStartTime: number | null = null;
  export let inspectorErrors: Partial<Record<PhaseOneDrawingPropertyField, string>> = {};
  export let selectedDrawingFieldValue: (
    field: PhaseOneDrawingPropertyField,
  ) => string | number | boolean = () => "";
  export let updateSelectedDrawingField: (
    field: PhaseOneDrawingPropertyField,
    control: PhaseOneDrawingPropertyFieldSchema["control"],
    event: Event,
  ) => void = () => {};
</script>

<section class="mini-card inspector-card" data-workbench-drawing-inspector>
  <div class="sidebar-head">
    <h4>Drawing</h4>
    <span>{selectedDrawing?.state.type ?? "None"}</span>
  </div>
  {#if selectedDrawing}
    <div class="inspector-sections">
      {#each selectedDrawing.schema.sections as section}
        <article class="inspector-section">
          <strong>{section.label}</strong>
          <div class="inspector-fields">
            {#each section.fields as field}
              <label class="inspector-field">
                <span>{field.label}</span>
                {#if field.control === "toggle"}
                  <input
                    type="checkbox"
                    checked={Boolean(selectedDrawingFieldValue(field.key))}
                    on:change={(event) => updateSelectedDrawingField(field.key, field.control, event)}
                  />
                {:else if field.control === "select"}
                  <select
                    value={String(selectedDrawingFieldValue(field.key))}
                    on:change={(event) => updateSelectedDrawingField(field.key, field.control, event)}
                  >
                    {#each field.options ?? [] as option}
                      <option value={option.value}>{option.label}</option>
                    {/each}
                  </select>
                {:else if field.control === "color"}
                  <input
                    type="color"
                    value={String(selectedDrawingFieldValue(field.key))}
                    on:input={(event) => updateSelectedDrawingField(field.key, field.control, event)}
                  />
                {:else if field.control === "text"}
                  <input
                    type="text"
                    value={String(selectedDrawingFieldValue(field.key))}
                    required={field.required ?? false}
                    on:change={(event) => updateSelectedDrawingField(field.key, field.control, event)}
                  />
                {:else}
                  <input
                    type="number"
                    min={field.min}
                    max={field.max}
                    step={field.step ?? (field.control === "time" ? "60000" : "1")}
                    value={String(selectedDrawingFieldValue(field.key))}
                    on:change={(event) => updateSelectedDrawingField(field.key, field.control, event)}
                  />
                {/if}
                {#if inspectorErrors[field.key]}
                  <small class="inspector-field-error">{inspectorErrors[field.key]}</small>
                {/if}
              </label>
            {/each}
          </div>
        </article>
      {/each}
    </div>
  {:else}
    <p class="inspector-empty">
      {#if activeDrawingTool === "horizontal-line"}
        Click the chart to place a horizontal line.
      {:else if activeDrawingTool === "trend-line"}
        {#if pendingTrendLineStartTime !== null}
          Click a second bar to finish the trend line. Press Escape to cancel.
        {:else}
          Click the chart to place the trend-line start point. Press Escape to cancel.
        {/if}
      {:else}
        Click a horizontal line or trend line on the chart to inspect its properties.
      {/if}
    </p>
  {/if}
</section>

<style>
  .mini-card {
    padding: 10px 12px;
    border-radius: 0;
    border: 0;
    border-bottom: 1px solid rgba(24, 24, 27, 0.08);
    background: transparent;
    box-shadow: none;
  }

  .sidebar-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    flex-wrap: nowrap;
  }

  .sidebar-head h4 {
    margin: 0;
  }

  .inspector-empty {
    margin: 10px 0 0;
    color: rgba(24, 24, 27, 0.58);
    font-size: 0.78rem;
    line-height: 1.45;
  }

  .inspector-sections {
    display: grid;
    gap: 12px;
    margin-top: 10px;
  }

  .inspector-section {
    display: grid;
    gap: 8px;
  }

  .inspector-section strong {
    font-size: 0.76rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(24, 24, 27, 0.44);
  }

  .inspector-fields {
    display: grid;
    gap: 8px;
  }

  .inspector-field {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    color: rgba(24, 24, 27, 0.74);
    font-size: 0.78rem;
  }

  .inspector-field input[type="text"],
  .inspector-field input[type="number"],
  .inspector-field input[type="color"],
  .inspector-field select {
    width: 112px;
    min-width: 0;
    box-sizing: border-box;
    border: 1px solid rgba(24, 24, 27, 0.12);
    background: rgba(255, 253, 247, 0.92);
    color: #18181b;
    border-radius: 8px;
    padding: 6px 8px;
    font: inherit;
  }

  .inspector-field input[type="color"] {
    padding: 2px;
    height: 32px;
  }

  .inspector-field input[type="checkbox"] {
    width: 16px;
    height: 16px;
  }

  .inspector-field-error {
    grid-column: 1 / -1;
    color: #9f2f1c;
    font-size: 0.72rem;
    line-height: 1.35;
  }
</style>
