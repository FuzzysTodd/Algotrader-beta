<?php
$networkName = 'Ethereum Sepolia';
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PHP DApp Starter</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 780px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
    .card { border: 1px solid #ddd; border-radius: 10px; padding: 1rem; margin-bottom: 1rem; }
    button { cursor: pointer; border: 0; border-radius: 8px; padding: 0.65rem 1rem; }
    .primary { background: #4f46e5; color: #fff; }
    .secondary { background: #e5e7eb; }
    code { background: #f5f5f5; padding: 0.1rem 0.3rem; border-radius: 4px; }
    #status { white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>PHP DApp Starter</h1>
  <p>
    This starter keeps blockchain actions on the client and uses PHP as an API layer.
    Target network: <strong><?= htmlspecialchars($networkName, ENT_QUOTES, 'UTF-8') ?></strong>.
  </p>

  <div class="card">
    <h2>1) Connect wallet</h2>
    <button id="connectBtn" class="primary">Connect MetaMask</button>
    <p><strong>Wallet:</strong> <span id="wallet">Not connected</span></p>
  </div>

  <div class="card">
    <h2>2) Sign a message (demo on-chain auth pattern)</h2>
    <button id="signBtn" class="secondary" disabled>Sign Message</button>
    <p><strong>Signature:</strong> <span id="signature">Not signed</span></p>
  </div>

  <div class="card">
    <h2>3) Send proof to PHP backend</h2>
    <button id="saveBtn" class="secondary" disabled>Store Signature</button>
    <p id="status">No request made.</p>
  </div>

  <script>
    const walletEl = document.getElementById('wallet');
    const signatureEl = document.getElementById('signature');
    const statusEl = document.getElementById('status');
    const connectBtn = document.getElementById('connectBtn');
    const signBtn = document.getElementById('signBtn');
    const saveBtn = document.getElementById('saveBtn');

    let selectedAddress = null;
    let signature = null;

    async function requireEthereum() {
      if (!window.ethereum) {
        throw new Error('MetaMask not found. Install extension and reload.');
      }
      return window.ethereum;
    }

    connectBtn.addEventListener('click', async () => {
      statusEl.textContent = 'Connecting wallet...';
      try {
        const eth = await requireEthereum();
        const accounts = await eth.request({ method: 'eth_requestAccounts' });
        selectedAddress = accounts[0] || null;
        walletEl.textContent = selectedAddress ?? 'Not connected';
        signBtn.disabled = !selectedAddress;
        statusEl.textContent = selectedAddress ? 'Wallet connected.' : 'No account returned by wallet.';
      } catch (error) {
        statusEl.textContent = `Connection failed: ${error.message}`;
      }
    });

    signBtn.addEventListener('click', async () => {
      statusEl.textContent = 'Requesting signature...';
      try {
        const eth = await requireEthereum();
        if (!selectedAddress) {
          throw new Error('Connect wallet first.');
        }
        const message = `Login proof at ${new Date().toISOString()}`;
        signature = await eth.request({
          method: 'personal_sign',
          params: [message, selectedAddress]
        });
        signatureEl.textContent = signature;
        saveBtn.disabled = false;
        statusEl.textContent = 'Message signed.';
      } catch (error) {
        statusEl.textContent = `Signature failed: ${error.message}`;
      }
    });

    saveBtn.addEventListener('click', async () => {
      if (!selectedAddress || !signature) {
        statusEl.textContent = 'Missing wallet address or signature.';
        return;
      }

      statusEl.textContent = 'Sending to backend...';
      try {
        const response = await fetch('api/store_signature.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: selectedAddress, signature })
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || 'Unknown API error');
        }

        statusEl.textContent = `Saved with id ${payload.data.id} at ${payload.data.created_at}`;
      } catch (error) {
        statusEl.textContent = `API error: ${error.message}`;
      }
    });
  </script>
</body>
</html>
