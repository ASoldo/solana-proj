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
import { deserialize, type Schema, serialize } from "borsh";

class Calculator {
  value = 0;
  constructor(fields: { value: number } | undefined = undefined) {
    if (fields) {
      this.value = fields.value;
    }
  }
}

const CalculatorSchema: Schema = new Map([
  [Calculator, { kind: "struct", fields: [["value", "u32"]] }],
]);

const fetchCalculatorValueNew = async (storageAccountPubkey: string) => {
  const connection = new web3.Connection(
    web3.clusterApiUrl("testnet"),
    "confirmed",
  );
  const accountInfo = await connection.getAccountInfo(
    new web3.PublicKey(storageAccountPubkey),
  );

  if (accountInfo === null) {
    throw new Error("Failed to find account");
  }

  // console.log("Data length:", accountInfo.data.length);
  console.log("First 4 bytes:", accountInfo.data.subarray(0, 4));

  console.log(
    "Account data bytes:",
    Array.from(accountInfo.data).map((byte) => byte.toString(16)),
  );
  console.log("Account data:", accountInfo.data);
  const storedValue = decodeStoredValue(accountInfo.data);
  console.log("Decoded stored value:", storedValue);
  try {
    const calculator = deserialize(
      CalculatorSchema,
      Calculator,
      accountInfo.data.subarray(0, 4),
    );
    console.log("Calculator value:", calculator.value);
  } catch (error) {
    console.error("Deserialization error:", error);
  }
};

const store = useCounterStore();
const { wallet, connected, signTransaction, sendTransaction, publicKey } =
  useWallet();
const ballance_frontend = ref<Number>(0);
const messages =
  ref<Array<ProgramNotificationResponse>>(Array<ProgramNotificationResponse>());
const receivedData = ref<ProgramNotificationResponse | null>(null);

const decodeStoredValue = (data: any) => {
  console.log(data);
  // Create a DataView on top of the Buffer
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  // Assuming the value is a 32-bit unsigned integer at the beginning of the data
  const storedValue = view.getUint32(0, true); // true for little-endian

  return storedValue;
};

const STORAGE_ACCOUNT = "4ehYYoGS5PpkYACNMPwZKeQ5WWmKnV3t9PsjCdULwb48";

fetchCalculatorValueNew(STORAGE_ACCOUNT);

type ProgramNotificationResponse = {
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
};

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
const ws = ref();
const connectWebSocket = () => {
  ws.value = new WebSocket("wss://api.testnet.solana.com/");

  ws.value.onopen = () => {
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
    ws.value.send(JSON.stringify(subscribeMessage));
  };

  ws.value.onmessage = (event: any) => {
    const parsedData: ProgramNotificationResponse = JSON.parse(event.data);
    receivedData.value = parsedData;
    if (receivedData.value.method === "programNotification") {
      console.log("Messages: ", messages.value);
      messages.value.push(receivedData.value as never);
    }
  };

  ws.value.onerror = (error: any) => {
    console.error("WebSocket error: ", error);
  };

  ws.value.onclose = () => {
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
  if (ws.value && receivedData.value) {
    console.log("Unsubscribing and disconnecting WebSocket");
    const unsubscribeMessage = {
      jsonrpc: "2.0",
      id: 1,
      method: "programUnsubscribe",
      params: [receivedData?.value.params.subscription],
    };
    ws.value.send(JSON.stringify(unsubscribeMessage));
    ws.value.close();
  }
});
</script>
