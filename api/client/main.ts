import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL, TransactionInstruction, Transaction, sendAndConfirmTransaction, SystemProgram, sendAndConfirmRawTransaction } from "@solana/web3.js";
import { createCalculatorInstructions, createKeypairFromFile } from "./util"
import * as borsh from "borsh";
import fs from "mz/fs";
import path from "path";
import os from "os";
import yaml from "yaml";

const CONFIG_FILE_PATH = path.resolve(
  os.homedir(),
  ".config",
  "solana",
  "cli",
  "config.yml"
);

let connection: Connection;
let localKeypair: Keypair;
let programKeypair: Keypair;
let programId: PublicKey;
let clientPubKey: PublicKey;

const PROGRAM_PATH = path.resolve(__dirname, "../dist/program");

export async function connect() {
  connection = new Connection("http://127.0.0.1:8899", "confirmed");
  console.log("Successfully connected to localhost");
}

export async function getLocalAccount() {
  const configYml = await fs.readFile(CONFIG_FILE_PATH, { encoding: "utf-8" });
  const keypairPath = await yaml.parse(configYml).keypair_path;
  localKeypair = await createKeypairFromFile(keypairPath);
  const airdropRequest = await connection.requestAirdrop(
    localKeypair.publicKey,
    LAMPORTS_PER_SOL * 2
  );
  const latestBlockhash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    signature: airdropRequest,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    blockhash: latestBlockhash.blockhash,

  });

  console.log("Local account loaded successfully");
  console.log("Local account address is: ", localKeypair.publicKey);
}

export async function getProgram(programName: string) {
  programKeypair = await createKeypairFromFile(
    path.join(PROGRAM_PATH, programName + "-keypair.json")
  );
  programId = programKeypair.publicKey;
  console.log("Program loaded successfully");
  console.log("Program name is: ", programName);
  console.log("ProgramId is: ", programId.toBase58());
}

export async function configureClientAccount(accountSpaceSize: number) {
  const SEED = "test1";
  clientPubKey = await PublicKey.createWithSeed(
    localKeypair.publicKey,
    SEED,
    programId
  );

  console.log("Client public key: ", clientPubKey.toBase58());

  const clientAccount = await connection.getAccountInfo(clientPubKey);
  if (clientAccount === null) {
    const transaction = new Transaction().add(
      SystemProgram.createAccountWithSeed({
        fromPubkey: localKeypair.publicKey,
        basePubkey: localKeypair.publicKey,
        seed: SEED,
        newAccountPubkey: clientPubKey,
        lamports: LAMPORTS_PER_SOL,
        space: accountSpaceSize,
        programId
      })
    );
    await sendAndConfirmTransaction(connection, transaction, [localKeypair]);
    console.log("Client accoutn created successfully");
  } else {
    console.log("Looks like that account exists already. We can just use it.");
  }
}

export async function pingProgram(programName: string, operation: number, operation_value: number) {
  console.log("Pinging program... ", programName);

  let calcInstructions = await createCalculatorInstructions(operation, operation_value);

  const instruction = new TransactionInstruction({
    keys: [{ pubkey: clientPubKey, isSigner: false, isWritable: true }],
    programId,
    data: calcInstructions,
  });

  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [localKeypair],
  );
  console.log("ping successfull");
}

export async function calculator(programName: string, accountSpaceSize: number) {
  await connect();
  await getLocalAccount();
  await getProgram(programName);
  await configureClientAccount(accountSpaceSize);
  await pingProgram(programName, 1, 5);
}

class Calculator {
  value = 0;
  constructor(fields: { value: number } | undefined = undefined) {
    if (fields) {
      this.value = fields.value;
    }
  }
}

const CalculatorSchema = {
  struct: {
    value: 'u32',
  },
};

const CALCULATOR_SIZE = borsh.serialize(
  CalculatorSchema,
  new Calculator(),
).length;




calculator("program", CALCULATOR_SIZE).then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  }
);
