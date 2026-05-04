package com.x402.sdk.crypto;

import org.web3j.abi.FunctionEncoder;
import org.web3j.abi.datatypes.Address;
import org.web3j.abi.datatypes.Array;
import org.web3j.abi.datatypes.Function;
import org.web3j.abi.datatypes.generated.Uint256;
import org.web3j.crypto.Credentials;
import org.web3j.crypto.RawTransaction;
import org.web3j.crypto.TransactionEncoder;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.core.methods.request.Transaction;
import org.web3j.protocol.core.methods.response.EthSendTransaction;
import org.web3j.protocol.http.HttpService;
import org.web3j.utils.Numeric;

import java.math.BigInteger;
import java.util.Arrays;
import java.util.Collections;

public class Web3Signer {

    private final Credentials credentials;
    private final Web3j web3j;

    public Web3Signer(String privateKey, String rpcUrl){
        this.credentials = Credentials.create(privateKey);
        this.web3j = Web3j.build(new HttpService(rpcUrl));
    }

    public String payAndGetTxHash(String receiveAddress, BigInteger usdcAmount, String usdcContractAddress) throws Exception{
        BigInteger nonce = web3j.ethGetTransactionCount(credentials.getAddress(), DefaultBlockParameterName.LATEST).send().getTransactionCount();
        BigInteger gasLimit = BigInteger.valueOf(100000);
        BigInteger gasPrice = web3j.ethGasPrice().send().getGasPrice();

        Function function = new Function(
                "transfer",
                Arrays.asList(new Address(receiveAddress), new Uint256(usdcAmount)),
                Collections.emptyList()
        );
        String encodedFunction = FunctionEncoder.encode(function);

        RawTransaction rawTransaction = RawTransaction.createTransaction(nonce, gasPrice, gasLimit, usdcContractAddress, BigInteger.ZERO, encodedFunction);

        byte[] bytes = TransactionEncoder.signMessage(rawTransaction, credentials);

        String hexValue =  Numeric.toHexString(bytes);

        EthSendTransaction ethSendTransaction = web3j.ethSendRawTransaction(hexValue).send();
        if(ethSendTransaction.hasError()){
            throw new RuntimeException("Blockchain rejected transaction: " + ethSendTransaction.getError().getMessage());
        }

        return ethSendTransaction.getTransactionHash();
    }

    public String getWalletAddress(){
        return credentials.getAddress();
    }

}
