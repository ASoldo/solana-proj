<script setup lang="ts">
const route = useRoute();
const soldo = "router";
</script>

<template>
  <div>
    <p>Current route: {{ route.path }}</p>
    <slot />
  </div>
</template>
