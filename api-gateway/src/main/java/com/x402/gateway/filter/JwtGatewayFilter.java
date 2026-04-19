package com.x402.gateway.filter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import org.springframework.core.io.buffer.DataBuffer;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Component
public class JwtGatewayFilter implements GlobalFilter, Ordered {
    @Value("${app.jwt-secret}")
    private String jwtSecret;


    private WebClient webClient = WebClient.create();

    private final List<String> publicPaths = List.of(
            "/api/auth/exchange", "/api/auth/refresh",
            "/api/auth/health", "/api/marketplace",
            "/oauth2", "/login/oauth2", "/health",
            "/api/pay/health"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

        //apiKey filtering
        String apikeyHeader = exchange.getRequest().getHeaders().getFirst("X-Api-Key");
        if(apikeyHeader!=null)
        {
            return webClient.get()
                    .uri("http://localhost:8081/api/auth/validate-key?apiKey="+apikeyHeader)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .flatMap(
                            response ->{
                                boolean valid = response.path("data").path("valid").asBoolean(false);
                                if(valid)
                                {
                                    Long UserId = response.path("data").path("userId").asLong();
                                    ServerHttpRequest request = exchange.getRequest().mutate()
                                            .header("X-User-Id", String.valueOf(UserId))
                                            .build();
                                    return chain.filter(exchange.mutate().request(request).build());
                                }
                                return writeUnauthorized(exchange, "Invalid API key");
                            })
                    .onErrorResume(e -> writeUnauthorized(exchange, "Key validation failed"));
        }



        //JWT filtering
        String path = exchange.getRequest().getURI().getPath();
        if(isPublicPath(path)) return chain.filter(exchange);

        String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");

        if(authHeader == null || !authHeader.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String token = authHeader.substring(7);
        try{
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            Claims claims = Jwts.parser().verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            ServerHttpRequest mutatedRequest = exchange.getRequest()
                    .mutate()
                    .header("X-User-Id", claims.getSubject())
                    .build();
            return chain.filter(exchange.mutate().request(mutatedRequest).build());
        }
        catch(Exception e){
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
    }

    private Mono<Void> writeUnauthorized(ServerWebExchange exchange, String message) {
        try
        {
            byte[] bytes = new ObjectMapper().writeValueAsBytes(Map.of("error", message));
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
            exchange.getResponse().getHeaders().set("Access-Control-Allow-Origin", "http://localhost:5173");
            exchange.getResponse().getHeaders().set("Access-Control-Allow-Credentials", "true");

            DataBuffer dataBuffer = exchange.getResponse().bufferFactory().wrap(bytes);
            return exchange.getResponse().writeWith(Mono.just(dataBuffer));
        }
        catch (Exception e)
        {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
    }

    @Override
    public int getOrder() {
        return -1; // Run before other filters
    }


    private boolean isPublicPath(String path) {
        return publicPaths.stream().anyMatch(path::startsWith);
    }

}
