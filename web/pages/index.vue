<template>
  <div>
    <br />
    <NuxtLink id="about-link" to="/about">About</NuxtLink>
    <ClientOnly>
      <WalletMultiButton dark />
    </ClientOnly>
    <h1 class="text-3xl font-bold underline bg-red-500">Hello world!</h1>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useCounterStore } from "@/stores/counter";
const store = useCounterStore();
import { WalletMultiButton, useWallet } from "solana-wallets-vue";
const { wallet, connected } = useWallet();

watch(connected, (newConnectedStatus, prevConnectedStatus) => {
  if (newConnectedStatus) {
    console.log('Wallet connected');
  } else {
    console.log('Wallet disconnected');
  }
});

const soldo = ref(0);
</script>
