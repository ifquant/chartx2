<script lang="ts">
  import { getChartxFoundation } from "$lib/chartx/public";

  const foundation = getChartxFoundation();
</script>

<svelte:head>
  <title>chartx2 | Phase One Foundation</title>
</svelte:head>

<main class="page">
  <section class="hero">
    <p class="eyebrow">chartx2 / phase one</p>
    <h1>Engine boundary established before chart migration starts.</h1>
    <p class="lede">
      The host shell now reads chart foundation data through a public chartx entrypoint
      instead of keeping future engine structure trapped in the page file.
    </p>
  </section>

  <section class="panel">
    <div>
      <h2>Public Surface</h2>
      <ul>
        {#each foundation.publicSurface as item}
          <li>{item}</li>
        {/each}
      </ul>
    </div>

    <div>
      <h2>Internal Layers</h2>
      <ul>
        {#each foundation.internalLayers as item}
          <li>{item}</li>
        {/each}
      </ul>
    </div>

    <div>
      <h2>Forbidden Shortcuts</h2>
      <ul>
        {#each foundation.forbiddenShortcuts as item}
          <li>{item}</li>
        {/each}
      </ul>
    </div>
  </section>

  <section class="steps">
    <h2>Phase-One Opening Moves</h2>
    <div class="step-grid">
      {#each foundation.phaseOneSteps as step}
        <article class:active={step.status === "active"}>
          <p class="step-id">{step.id}</p>
          <h3>{step.title}</h3>
          <p>{step.note}</p>
        </article>
      {/each}
    </div>
  </section>
</main>

<style>
:root {
  color: #101010;
  background:
    radial-gradient(circle at top, rgba(221, 232, 255, 0.95), transparent 34%),
    linear-gradient(180deg, #f7f6f1 0%, #ece8dc 100%);
  font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif;
}

.page {
  min-height: 100vh;
  padding: 3rem 1.5rem 4rem;
}

.hero,
.panel,
.steps {
  width: min(1080px, 100%);
  margin: 0 auto;
}

.hero {
  margin-bottom: 2rem;
}

.eyebrow {
  margin: 0 0 0.75rem;
  font-size: 0.85rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

h1 {
  max-width: 12ch;
  margin: 0;
  font-size: clamp(2.8rem, 7vw, 5.6rem);
  line-height: 0.94;
  font-weight: 700;
}

.lede {
  max-width: 52rem;
  margin: 1.25rem 0 0;
  font-size: 1.15rem;
  line-height: 1.6;
}

.panel {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.panel > div,
.step-grid article {
  border: 1px solid rgba(16, 16, 16, 0.14);
  background: rgba(255, 253, 247, 0.82);
  box-shadow: 0 12px 30px rgba(16, 16, 16, 0.08);
}

.panel > div {
  padding: 1.25rem;
}

h2 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

ul {
  margin: 0;
  padding-left: 1.2rem;
}

li + li {
  margin-top: 0.55rem;
}

.step-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.step-grid article {
  min-height: 13rem;
  padding: 1.25rem;
}

.step-grid article.active {
  background: #101010;
  color: #f7f6f1;
}

.step-id {
  margin: 0 0 1rem;
  font-size: 0.82rem;
  letter-spacing: 0.18em;
}

h3 {
  margin: 0 0 0.85rem;
  font-size: 1.4rem;
}

article p:last-child {
  margin-bottom: 0;
  line-height: 1.5;
}

@media (max-width: 900px) {
  .panel,
  .step-grid {
    grid-template-columns: 1fr;
  }
}
</style>
