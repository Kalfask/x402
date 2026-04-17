import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSendPayment } from './useSendPayment';

const API_BASE = 'http://localhost:8080';

export function useApiCall() {
  const { accessToken } = useAuth();
  const { sendPayment } = useSendPayment();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');

  const callApi = async (endpointId, endpointPath) => {
    setLoading(true);
    setError(null);
    setStatus('Calling API...');

    try {
      // Step 1: Call the API (will get 402)
      const res1 = await fetch(`${API_BASE}/api/call/${endpointId}${endpointPath}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      // Step 2: If 402, handle payment automatically
      if (res1.status === 402) {
        const paymentInfo = await res1.json();
        const x402 = paymentInfo.x402;

        setStatus('Payment required — waiting for MetaMask...');

        // Step 3: Send USDC via MetaMask (auto popup)
        const txHash = await sendPayment(x402.payTo, x402.price);

        setStatus('Payment sent — verifying on blockchain...');

        // Step 4: Retry with payment proof
        const res2 = await fetch(`${API_BASE}/api/call/${endpointId}${endpointPath}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-402-Payment': txHash,
          },
        });

        const result = await res2.json();
        setLoading(false);
        setStatus('');
        return { success: true, data: result };
      }

      // Not 402 — return the response
      const result = await res1.json();
      setLoading(false);
      setStatus('');
      return { success: true, data: result };

    } catch (err) {
      const msg = err.message.includes('User rejected')
        ? 'Payment cancelled'
        : err.message;
      setError(msg);
      setLoading(false);
      setStatus('');
      return null;
    }
  };

  // Manual flow (paste txHash) as fallback
  const callApiWithPayment = async (endpointId, endpointPath, txHash) => {
    setLoading(true);
    setError(null);
    setStatus('Verifying payment...');

    try {
      const res = await fetch(`${API_BASE}/api/call/${endpointId}${endpointPath}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-402-Payment': txHash,
        },
      });

      const result = await res.json();
      setLoading(false);
      setStatus('');
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      setStatus('');
      return null;
    }
  };

  return { callApi, callApiWithPayment, loading, error, status };
}