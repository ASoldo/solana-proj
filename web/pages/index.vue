<template>
  <div>
    <br />
    <NuxtLink id="about-link" to="/about">About</NuxtLink>
    <ClientOnly>
      <WalletMultiButton dark />
    </ClientOnly>
    <h1 class="text-3xl font-bold underline bg-red-500">Hello world!</h1>
    <button @click="sendTrans">{{connected ? "Connected":"Connect"}}</button>
    <button @click="sendSol">Send Sol</button>
    <h1 v-if="connected">{{ballance_frontend}} SOL <span class="bg-blue-500 rounded-2xl p-1.5 mx-1 text-white">{{wallet?.adapter.publicKey}}</span></h1>
    <h1>WebSocket messages</h1>
    <ul class="h-32 overflow-hidden overflow-y-auto border-black border p-2 m-2">
      <li v-for="(message, index) in messages" :key="index">{{ message }}</li>
    </ul>
    <div>
      <div v-if="receivedData">
    <p><strong>JSON RPC Version:</strong> {{ receivedData.jsonrpc }}</p>
    <p><strong>Method:</strong> {{ receivedData.method }}</p>
    <p><strong>Subscription ID:</strong> {{ receivedData.params.subscription }}</p>
    <p><strong>Slot:</strong> {{ receivedData.params.result.context.slot }}</p>
    <p><strong>Lamports:</strong> {{ receivedData.params.result.value.lamports }}</p>
    <p><strong>Owner:</strong> {{ receivedData.params.result.value.owner }}</p>
    <p><strong>Space:</strong> {{ receivedData.params.result.value.space }}</p>
    <p><strong>Decoded Data:</strong> {{ decodeBase64(receivedData.params.result.value.data[0]) }}</p>
  </div>
  <div v-else>
    <p>No data received yet.</p>
  </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import * as web3 from "@solana/web3.js"
import { useCounterStore } from "@/stores/counter";
const store = useCounterStore();
import { WalletMultiButton, useWallet } from "solana-wallets-vue";
const { wallet, connected, signTransaction, sendTransaction, publicKey } = useWallet();
const decodeBase64 = (base64String: string) => {
  try {
    return atob(base64String);
  } catch (error) {
    console.error('Error decoding base64 data:', error);
    return 'Error decoding data';
  }
};
interface AccountNotification {
  jsonrpc: string;
  method: string;
  params: {
    result: {
      context: {
        slot: number;
      };
      value: {
        lamports: number;
        data: [string, string]; // Assuming data is a tuple of [dataContent, encoding]
        owner: string;
        space: number;
      };
    };
    subscription: number;
  };
}

console.log(web3.clusterApiUrl());
console.log(web3.LAMPORTS_PER_SOL);
console.log(web3.SystemProgram.programId);
console.log(web3.SystemProgram.transfer.name);
console.log(wallet.value?.adapter.publicKey);

watch(connected, (newConnectedStatus, prevConnectedStatus) => {
  if (newConnectedStatus) {
    console.log('Wallet connected');
  } else {
    console.log('Wallet disconnected');
  }
});

const sendSol = (event: any) => {
  const transaction = new web3.Transaction();
  const recipientPubKey = new web3.PublicKey("6mk1RTD2Wtv3AJxoWw6vqb3iT7gu5n8bwgQVXwfJssnF");

  const sendSolInstruction = web3.SystemProgram.transfer({
    fromPubkey: wallet.value?.adapter.publicKey as web3.PublicKey,
    toPubkey: recipientPubKey,
    lamports: web3.LAMPORTS_PER_SOL * 0.1,
  });

    const connection = new web3.Connection(
    web3.clusterApiUrl('testnet'),
    'confirmed',
  );

  transaction.add(sendSolInstruction);
  sendTransaction(transaction, connection).then((sig)=> {
    console.log(sig);
  });
}

const messages = ref([]);
const receivedData = ref<AccountNotification | null>(null);

const connectWebSocket = () => {
  const ws = new WebSocket('ws://127.0.0.1:8900');

  ws.onopen = () => {
    console.log('WebSocket connected');
    // Subscribe to account changes
    const subscribeMessage = {
      jsonrpc: "2.0",
      id: 1,
      method: "accountSubscribe",
      params: [
        "SysvarRecentB1ockHashes11111111111111111111", // This is just an example, replace with your account's public key
        {
          encoding: "base64",
          commitment: "finalized",
        },
      ],
    };
    ws.send(JSON.stringify(subscribeMessage));
  };

  ws.onmessage = (event) => {
    const parsedData: AccountNotification = JSON.parse(event.data);
    receivedData.value = parsedData; // Store the parsed data
    messages.value.push(receivedData.value as never); // 
  };

  ws.onerror = (error) => {
    console.error('WebSocket error: ', error);
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
  };
};

onMounted(() => {
  connectWebSocket();
});

const ballance_frontend = ref<Number>(-1);

const ballance = async () => {

  if (!wallet.value?.adapter.publicKey) {
    console.log('Wallet not connected');
    return;
  }
  const connection = new web3.Connection(
    web3.clusterApiUrl('devnet'),
    'confirmed',
  );
  return await connection.getBalance(wallet.value?.adapter.publicKey);
}

ballance_frontend.value = await ballance() as any;

const sendTrans = async () => {
  if (!wallet.value?.adapter.publicKey) {
    console.log('Wallet not connected');
    return;
  }
  const connection = new web3.Connection(
    web3.clusterApiUrl('testnet'),
    'confirmed',
  );
  console.log(await connection.getBalance(wallet.value?.adapter.publicKey));
  
  const transaction = new web3.Transaction().add(
    web3.SystemProgram.transfer({
      fromPubkey: wallet.value.adapter.publicKey,
      toPubkey: new web3.PublicKey("6mk1RTD2Wtv3AJxoWw6vqb3iT7gu5n8bwgQVXwfJssnF"),
      lamports: 0,
    }),
  );

  // try {
  //   const { blockhash } = await connection.getLatestBlockhash();
  //   transaction.recentBlockhash = blockhash;
  //   transaction.feePayer = wallet.value.adapter.publicKey;
  //
  //   const signature = await wallet.value.adapter.sendTransaction(transaction, connection);
  //   console.log('Transaction signature:', signature);
  // } catch (error) {
  //   console.error('Transaction failed:', error);
  // }
};
</script>
