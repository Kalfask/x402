package com.x402.gateway.filter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Map;

@Component
public class X402PaymentFilter implements GlobalFilter , Ordered {

    @Value(("${app.internal-api-key}"))
    private String internalApiKey;

    private final WebClient webClient = WebClient.create();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public int getOrder() {return 0;} //after jwt filter (-1)

    @Override
   public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        if(!path.startsWith("/api/call/"))
        {
            return chain.filter(exchange);
        }
        String paymentHeader = exchange.getRequest().getHeaders().getFirst("X-402-Header");
        if(paymentHeader == null)
        {
            return return402(exchange,path);
        }

        return verifyAndForward(exchange,chain,paymentHeader,path);
    }

    private Mono<Void> return402(ServerWebExchange exchange, String path) {

            // TODO: Look up endpoint price from provider-service
            // For now, use path segments to identify the API
            // Path format: /api/call/{apiId}/{endpointPath}
            // In production, call provider-service to get pricing:
            // GET http://localhost:8082/api/provider/endpoints/lookup?path=...

            Map<String,Object> body = Map.of(
                "x402", Map.of(
                        "version",1,
                        "price", "0.001",
                        "currency", "USDC",
                        "network", "base-sepolia",
                        "payTo","PROVIDER_WALLET_FROM_DB",
                        "description", "API call payment required"
                )
        );
        return writeJsonResponse( exchange, HttpStatus.PAYMENT_REQUIRED,body);
    }

    private Mono<Void> verifyAndForward(ServerWebExchange exchange, GatewayFilterChain chain, String txHash, String path) {
        String userId= exchange.getRequest().getHeaders().getFirst("X-User-Id");

        Map<String, Object> verifyBody = Map.of(
                "txHash", txHash,
                "consumerId", Long.parseLong(userId),
                "endpointId", 1L, // TODO: look up from path
                "apiId", 1L, // TODO: look up from path
                "providerId", 1L, // TODO: look up from DB
                "providerWallet", "0x...", // TODO: from DB
                "expectedAmount", 0.001 // TODO: from DB
        );


        return webClient.post()
                .uri("http://localhost:8083/api/pay/verify")
                .header("X-Internal-Key", internalApiKey)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .bodyValue(verifyBody)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .flatMap(response -> {
                    boolean valid = response.path("data")
                            .path("valid").asBoolean(false);
                    if (valid) {
                        return chain.filter(exchange);
                    }
                    else {
                        String reason = response.path("data")
                                .path("reason").asText("Payment failed");
                        return writeJsonResponse(exchange,HttpStatus.PAYMENT_REQUIRED,Map.of("error", reason));
                    }

                })
                .onErrorResume(e -> writeJsonResponse(exchange,HttpStatus.BAD_GATEWAY,Map.of("error", "Payment verification unavailable")));
    }

    private Mono<Void> writeJsonResponse(ServerWebExchange exchange, HttpStatus status, Object body) {
        try
        {
            byte[] bytes = objectMapper.writeValueAsBytes(body);
            exchange.getResponse().setStatusCode(status);
            exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
            DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(bytes);
            return exchange.getResponse().writeWith(Mono.just(buffer));
        }
        catch (Exception e)
        {
            exchange.getResponse().setStatusCode(HttpStatus.INTERNAL_SERVER_ERROR);
            return exchange.getResponse().setComplete();
        }
    }

}
