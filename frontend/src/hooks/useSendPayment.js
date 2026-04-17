import { useWriteContract } from 'wagmi';
import { parseUnits, getAddress } from 'viem';

const ERC20_ABI = [{
  name: 'transfer',
  type: 'function',
  stateMutability: 'nonpayable',
  inputs: [
    { name: 'to', type: 'address' },
    { name: 'amount', type: 'uint256' },
  ],
  outputs: [{ type: 'bool' }],
}];

const USDC_CONTRACT = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

export function useSendPayment() {
  const { writeContractAsync } = useWriteContract();

  const sendPayment = async (toAddress, amount) => {
    // getAddress() converts to proper checksum format
    const checksumAddress = getAddress(toAddress.toLowerCase());

    const txHash = await writeContractAsync({
      address: USDC_CONTRACT,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [
        checksumAddress,
        parseUnits(amount, 6),
      ],
    });
    return txHash;
  };

  return { sendPayment };
}