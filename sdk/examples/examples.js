const { X402Client } = require('../src/index');

// ============================================
// Example 1: Auto-pay with wallet (fully automated)
// ============================================
async function autoPayExample() {
  const client = new X402Client({
    apiKey: 'apikey',
    baseUrl: 'http://localhost:8080',
    privateKey: 'privatekey',  // Never hardcode in production!
    rpcUrl: 'https://sepolia.base.org',
  });

  console.log('Wallet address:', client.getAddress());
  console.log('USDC balance:', await client.getBalance());

  // One line — handles 402, pays, retries automatically
  const responseTest1 = await client.get(1, '/api/breeds/image/random');
  const responseTest2 = await client.getByName('dog', '/api/breeds/image/random');
  console.log('Got response:', responseTest1);
  console.log('Got response by name:', responseTest2);
}

// ============================================
// Example 2: Manual payment (no private key)
// ============================================
async function manualExample() {
  const client = new X402Client({
    apiKey: 'x402_sk_YOUR_API_KEY_HERE',
    baseUrl: 'http://localhost:8080',
    // No privateKey — will throw with payment instructions
  });

  try {
    const joke = await client.get(6, '/breeds/image/random');
    console.log('Got joke:', joke);
  } catch (err) {
    console.log(err.message);
    // "Payment required but no wallet configured.
    //  Price: 0.001 USDC
    //  Pay to: 0xProviderWallet..."
  }
}

autoPayExample();