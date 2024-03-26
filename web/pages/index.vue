<template>
  <div>
    <br />
    <NuxtLink id="about-link" to="/about">About</NuxtLink>
    <h1 class="text-3xl font-bold underline bg-red-500">Hello world!</h1>
  </div>
</template>

<script setup lang="ts">
import { useCounterStore } from "@/stores/counter";
const store = useCounterStore();
</script>
