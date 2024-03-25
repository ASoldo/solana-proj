import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL, TransactionInstruction, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import fs from "mz/fs";
import path from "path";

const PROGRAM_KEYPAIR_PATH = path.join(
  path.resolve(__dirname, "../dist/program"),
  "program-keypair.json"
);

async function main() {
  console.log("Launching client...");

  //connect to solana localhost net
  let connection = new Connection("http://127.0.0.1:8899", "confirmed");
  let secretKeyString = await fs.readFile(PROGRAM_KEYPAIR_PATH, "utf-8");
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  const programKeypair = Keypair.fromSecretKey(secretKey);
  let programId: PublicKey = programKeypair.publicKey;


  //generate an acount (keypair) to transact with our program
  const triggerKeypair = Keypair.generate();
  const airdropRequest = await connection.requestAirdrop(
    triggerKeypair.publicKey,
    LAMPORTS_PER_SOL
  );

  const latestBlockhash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    signature: airdropRequest,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    blockhash: latestBlockhash.blockhash,

  });

  // conduct a translaction with our program
  console.log("--Pinging Program--", programId.toBase58());
  const instruction = new TransactionInstruction({
    keys: [{ pubkey: triggerKeypair.publicKey, isSigner: false, isWritable: true }],
    programId,
    data: Buffer.alloc(0),
  });

  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [triggerKeypair]
  );

}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  }
);

