# Solana How to

## 1. Start local solana blockchain

```sh
solana-test-validator --reset
```

## 2. Create new key pair

```sh
solana-keygen new -o ~/.config/solana/id.json
```

## 3. Set keypair

```sh
solana config set --keypair ~/.config/solana/id.json
```

## 4. Set url

```sh
solana config set --url localhost
```

## 5. Check setting

```sh
solana config get
```

## 6. Build program

```sh
npm run build:program
```

## 7. Request Airdrop (SOL)

```sh
solana airdrop 5
```

## 8. Deploy program

```sh
solana program deploy dist/program/program.so
```

## 9. Run client

```sh
npm run start
```

## 10. Log response from blockchain

```sh
solana logs | grep "<PROGRAM_ID> invoke" -A 10

```
