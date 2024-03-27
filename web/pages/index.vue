<template>
  <div>
    <br />
    <NuxtLink id="about-link" to="/about">About</NuxtLink>
    <ClientOnly>
      <WalletMultiButton dark />
    </ClientOnly>
    <h1 class="text-3xl font-bold underline bg-red-500">Hello world!</h1>
    <button @click="sendSol">Send Sol</button>
    <h1 v-if="connected">
      {{ ballance_frontend }} SOL
      <span class="bg-blue-500 rounded-2xl p-1.5 mx-1 text-white">{{
        wallet?.adapter.publicKey
      }}</span>
    </h1>
    <h1>WebSocket messages</h1>
    <ul
      class="h-32 overflow-hidden overflow-y-auto border-black border p-2 m-2"
    >
      <li v-for="(message, index) in messages" :key="index">
        {{ message.params.result.value.account.data }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
import * as web3 from "@solana/web3.js";
import { useCounterStore } from "@/stores/counter";
import { WalletMultiButton, useWallet } from "solana-wallets-vue";

const store = useCounterStore();
const { wallet, connected, signTransaction, sendTransaction, publicKey } =
  useWallet();
const ballance_frontend = ref<Number>(0);
const messages =
  ref<Array<ProgramNotificationResponse>>(Array<ProgramNotificationResponse>());
const receivedData = ref<ProgramNotificationResponse | null>(null);

interface ProgramNotificationResponse {
  jsonrpc: string;
  method: string;
  params: {
    result: {
      context: {
        slot: number;
      };
      value: {
        pubkey: string;
        account: {
          lamports: number;
          data: [string, string];
          executable: boolean;
          owner: string;
          rentEpoch: number;
          space: number;
        };
      };
    };
    subscription: number;
  };
}

type AccountNotification = {
  jsonrpc: string;
  method: string;
  params: {
    result: {
      context: {
        slot: number;
      };
      value: {
        lamports: number;
        data: {
          program: string;
          parsed: {
            info: Array<{
              blockhash: string;
              feeCalculator: {
                lamportsPerSignature: string;
              };
            }>;
            type: string;
          };
          space: number;
          executable: boolean;
        };
        owner: string;
        rentEpoch: number;
        space: number;
      };
    };
    subscription: number;
  };
};

console.log(web3.clusterApiUrl());
console.log(web3.LAMPORTS_PER_SOL);
console.log(web3.SystemProgram.programId);
console.log(web3.SystemProgram.transfer.name);
console.log(wallet.value?.adapter.publicKey);

watch(connected, async (newConnectedStatus, prevConnectedStatus) => {
  if (newConnectedStatus) {
    console.log("Wallet connected");
    await fetchBalance();
  } else {
    console.log("Wallet disconnected");
  }
});

const sendSol = () => {
  const transaction = new web3.Transaction();
  const recipientPubKey = new web3.PublicKey(
    "6cGupPkbJy2mYHuBJu4Wgn345NiBCpU4P4vrjTvZeMX2",
  );

  const sendSolInstruction = web3.SystemProgram.transfer({
    fromPubkey: wallet.value?.adapter.publicKey as web3.PublicKey,
    toPubkey: recipientPubKey,
    lamports: web3.LAMPORTS_PER_SOL * 0.1,
  });

  const connection = new web3.Connection(
    web3.clusterApiUrl("testnet"),
    "confirmed",
  );

  transaction.add(sendSolInstruction);
  sendTransaction(transaction, connection).then((sig) => {
    console.log(sig);
  });
};

const connectWebSocket = () => {
  const ws = new WebSocket("wss://api.testnet.solana.com/");

  ws.onopen = () => {
    console.log("WebSocket connected");
    const subscribeMessage = {
      jsonrpc: "2.0",
      id: 1,
      method: "programSubscribe",
      params: [
        "4ehYYoGS5PpkYACNMPwZKeQ5WWmKnV3t9PsjCdULwb48",
        {
          encoding: "jsonParsed",
          commitment: "finalized",
        },
      ],
    };
    ws.send(JSON.stringify(subscribeMessage));
  };

  ws.onmessage = (event: any) => {
    const parsedData: ProgramNotificationResponse = JSON.parse(event.data);
    receivedData.value = parsedData;
    if (receivedData.value.method === "programNotification") {
      console.log("Messages: ", messages.value);
      messages.value.push(receivedData.value as never);
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket error: ", error);
  };

  ws.onclose = () => {
    console.log("WebSocket disconnected");
  };
};

const fetchBalance = async () => {
  if (!wallet.value?.adapter.connected && !wallet.value?.adapter.publicKey) {
    console.log("Wallet not connected");
    ballance_frontend.value = 0;
    return;
  }
  const connection = new web3.Connection(
    web3.clusterApiUrl("testnet"),
    "confirmed",
  );
  const balance = await connection.getBalance(
    wallet.value?.adapter.publicKey as web3.PublicKey,
  );
  ballance_frontend.value = balance / web3.LAMPORTS_PER_SOL;
};

onMounted(async () => {
  connectWebSocket();

  setTimeout(async () => {
    await fetchBalance();
  }, 10);

  // nextTick(async () => {
  //   await fetchBalance()
  // });
});

onUnmounted(() => {
  console.log("Unmounted");
});
</script>
