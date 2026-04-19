# PHP DApp starter (scan + scaffold)

This folder is a simple answer to "make a DApp in PHP":

- **Client-side web3 flow** (MetaMask connect + sign message) in `index.php`
- **PHP API endpoint** in `api/store_signature.php`
- **SQLite storage** for signed proofs in `storage/dapp.sqlite`

## Why this architecture

PHP does not directly run smart contracts. A practical DApp with PHP is usually:

1. Wallet actions done in browser JavaScript (connect/sign/send tx)
2. PHP backend verifies or stores signed data
3. Optional: backend indexers/cron jobs to sync on-chain state

## Run locally

```bash
cd php-dapp
php -S 0.0.0.0:8080
```

Open:

- `http://localhost:8080/index.php`

## API quick test (without wallet)

```bash
curl -X POST http://localhost:8080/api/store_signature.php \
  -H 'Content-Type: application/json' \
  -d '{"address":"0x1111111111111111111111111111111111111111","signature":"0xabcdefabcdefabcdefabcdefabcdefabcdef"}'
```

## Next steps

- Verify signatures server-side with a PHP EVM helper library.
- Add nonce/session challenge to prevent replay attacks.
- Connect contract reads via JSON-RPC/Alchemy/Infura.
