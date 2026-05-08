<script lang="ts">
  export let value = "";
</script>

<input
  type="text"
  inputmode="numeric"
  bind:value
  {...$$restProps}
/>
