const { ethers } = require('ethers');

const ERC20_ABI = [
    'function transfer(address to, uint256 amount) returns (bool)',
    'function balanceOf(address owner) view returns (uint256)'
];

class X402Client {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl || 'http://localhost:8080';
        this.usdcContract = config.usdcContract || '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

        this.endpointCache = new Map();

        if (config.privateKey) {
            const rpcUrl = config.rpcUrl || 'https://sepolia.base.org';
            this.provider = new ethers.JsonRpcProvider(rpcUrl);
            this.wallet = new ethers.Wallet(config.privateKey, this.provider);
            this.usdc = new ethers.Contract(this.usdcContract, ERC20_ABI, this.wallet);
        }
    }

    // ==========================================
    // Core Call Logic (Using ID)
    // ==========================================
    async call(endpointId, endpointPath, options = {}) {
        // Safe path handling
        const safePath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
        const url = `${this.baseUrl}/api/call/${endpointId}${safePath}`;
        
        // 🔥 MERGE DEVELOPER HEADERS WITH THE API KEY
        const headers = {
            'X-API-Key': this.apiKey,
            ...(options.headers || {}) 
        };
        
        if (options.body && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        const response1 = await fetch(url, {
            method: options.method || 'GET',
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined,
        });

        if (response1.status !== 402) {
            return await response1.json();
        }

        const paymentInfo = await response1.json();
        const x402 = paymentInfo.x402;

        if (!this.wallet) {
            throw new Error('Payment required but no wallet configured. ' +
                'Provide a privateKey in the constructor, or pay manually with X-402-Payment header.\n' +
                `Price: ${x402.price} ${x402.currency}\n` +
                `Pay to: ${x402.payTo}`);
        }

        const amount = ethers.parseUnits(x402.price, 6);
        const payToaddress = x402.payTo.toLowerCase();
        const tx = await this.usdc.transfer(payToaddress, amount);
        const receipt = await tx.wait();

        headers['X-402-Payment'] = receipt.hash;

        const response2 = await fetch(url, {
            method: options.method || 'GET',
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined,
        });
        return await response2.json();
    }

    // 🔥 ADD 'options' TO YOUR HELPER METHODS
    async get(endpointId, endpointPath, options = {}) {
        return this.call(endpointId, endpointPath, { ...options, method: 'GET' });
    }

    async post(endpointId, endpointPath, body, options = {}) {
        return this.call(endpointId, endpointPath, { ...options, method: 'POST', body });
    }

    // ==========================================
    // Discovery Logic (Using Name)
    // ==========================================
    async _resolveEndpointId(apiName, endpointPath) {
        const cacheKey = `${apiName}:${endpointPath}`;

        if (this.endpointCache.has(cacheKey)) {
            return this.endpointCache.get(cacheKey);
        }

        const response = await fetch(`${this.baseUrl}/api/marketplace/findEndpointId`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-API-Key': this.apiKey // Your excellent secure addition!
             },
            body: JSON.stringify({ name: apiName, path: endpointPath })
        });

        if (!response.ok) {
            throw new Error(`Marketplace discovery failed: HTTP ${response.status}`);
        }

        const jsonResponse = await response.json();

        if (!jsonResponse.success || !jsonResponse.data) {
            throw new Error(`API Not Found: Could not find "${apiName}" with path "${endpointPath}".`);
        }

        const endpointId = jsonResponse.data;
        this.endpointCache.set(cacheKey, endpointId);
        return endpointId;
    }

    // 🔥 ADD 'options' TO YOUR NAME HELPER METHODS
    async callByName(apiName, endpointPath, options = {}) {
        const endpointId = await this._resolveEndpointId(apiName, endpointPath);
        return this.call(endpointId, endpointPath, options);
    }

    async getByName(apiName, endpointPath, options = {}) {
        return this.callByName(apiName, endpointPath, { ...options, method: 'GET' });
    }

    async postByName(apiName, endpointPath, body, options = {}) {
        return this.callByName(apiName, endpointPath, { ...options, method: 'POST', body });
    }

    // ==========================================
    // Wallet Utilities
    // ==========================================
    async getBalance() {
        if (!this.wallet) {
            throw new Error('No wallet configured. Provide a privateKey in the constructor.');
        }
        const usdc = new ethers.Contract(this.usdcContract, ERC20_ABI, this.provider);
        const balance = await usdc.balanceOf(this.wallet.address);
        return ethers.formatUnits(balance, 6);
    }

    getAddress() {
        if (!this.wallet) {
            throw new Error('No wallet configured. Provide a privateKey in the constructor.');
        }
        return this.wallet.address;
    }
}

module.exports = { X402Client };