package com.x402.payment_service.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.protocol.http.HttpService;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.Optional;

@Service
@Slf4j
public class BlockchainService {
    @Value("${app.blockchain.rpc-url}")
    private String rpcUrl;

    @Value("${app.blockchain.usdc-contract}")
    private String usdcContract;

    @Value("${app.blockchain.usdc-decimals}")
    private int usdcDecimals;

    private Web3j web3j;

    private static final String TRANSFER_EVENT_SIG = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";


    @PostConstruct
    public void init()
    {
        this.web3j = Web3j.build(new HttpService(rpcUrl));
        log.info("Connected to Blockchain: {}",rpcUrl);
    }


    /**
     * Verify a USDC transfer on-chain.
     * @param txHash The transaction hash from the consumer
     * @param toAddress The expected recipient (provider wallet)
     * @param amount The expected USDC amount
     * @return true if payment is valid and confirmed
     */

    public boolean verifyPayment(String txHash, String toAddress, BigDecimal amount)
    {
        try{
            Optional<TransactionReceipt> receiptOpt = web3j.ethGetTransactionReceipt(txHash).send().getTransactionReceipt();
            if (receiptOpt.isEmpty())
            {
                log.warn("Received empty transaction receipt for txHash: {}",txHash);
                return false;
            }
            TransactionReceipt receipt = receiptOpt.get();

            if(!receipt.isStatusOK())
            {
                log.warn("Transaction failed for txHash: {}",txHash);
                return false;
            }

            if(!usdcContract.equalsIgnoreCase(receipt.getTo()))
            {
                log.warn("Tx not to USDC contract {}", receipt.getTo());
                return false;
            }

            return verifyTransferEvent(receipt,toAddress,amount);
        }
        catch (Exception e)
        {
            log.error("Exception in verifyPayment",e);
            return false;
        }
    }

    /**
     * Parse the ERC-20 Transfer event from transaction logs.
     * Transfer(from, to, value) - topic[0] is event signature,
     * topic[1] is from, topic[2] is to, data is value.
     */

    private boolean verifyTransferEvent(TransactionReceipt receipt,String toAddress,BigDecimal amount)
    {
        /*String transferSig = "0xddf252ad1be2c89b69c2b068fc378daa"
                           + "952ba7f163c4a11628f55a4df523b3ef";*/

        BigInteger expectedRaw = amount.multiply(BigDecimal.TEN.pow(usdcDecimals)).toBigInteger();

        for(var logEntry :  receipt.getLogs())
        {
            var topics = logEntry.getTopics();
            if(topics.size() >= 3 && topics.get(0).equalsIgnoreCase(TRANSFER_EVENT_SIG))
            {
                String logTo = "0x" + topics.get(2).substring(26);

                BigInteger logAmount = new BigInteger(logEntry.getData().substring(2),16);

                if(logTo.equalsIgnoreCase(toAddress) && logAmount.compareTo(expectedRaw) >= 0 )
                {
                    return true;
                }
            }
        }
        log.warn("No matching Transfer event found in tx {}", receipt.getTransactionHash());
        return false;

    }
}
