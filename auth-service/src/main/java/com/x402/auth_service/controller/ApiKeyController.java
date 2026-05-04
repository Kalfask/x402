package com.x402.auth_service.controller;

import com.x402.auth_service.entity.ConsumerApiKey;
import com.x402.auth_service.service.ApiKeyService;
import com.x402.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/auth/keys")
@RequiredArgsConstructor
public class ApiKeyController {

    private final ApiKeyService apiKeyService;

    private Long getUserId(Authentication authentication) {
        return Long.parseLong(authentication.getName());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String,String>>> createKey(@RequestBody Map<String, String> body,
                                                                     Authentication authentication) {
         ConsumerApiKey key = apiKeyService.createApiKey(getUserId(authentication), body.getOrDefault("name", "Default key"));
         return ResponseEntity.ok(ApiResponse.ok(Map.of(
                 "id", key.getId().toString(),
                 "apiKey", key.getApiKey(),
                 "name", key.getName(),
                 "message", "Save this key - it won't be shown again"
         )));
    }

    @GetMapping ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMyKeys(Authentication authentication) {
        List<Map<String, Object>> keys = apiKeyService.getMyKeys(getUserId(authentication))
                .stream().map(k-> Map.<String,Object>of(
                        "id", k.getId(),
                        "name", k.getName(),
                        "prefix", k.getKeyPrefix(),
                        "active", k.isActive(),
                        "createdAt", k.getCreatedAt().toString(),
                        "lastUsedAt", k.getLastUsedAt() != null
                                ? k.getLastUsedAt().toString() : "Never"
                ))
                .toList();

        return ResponseEntity.ok(ApiResponse.ok(keys));

    }

    @DeleteMapping("/{keyId}")
    public ResponseEntity<ApiResponse<String>> deactivateKey(@PathVariable("keyId") Long keyId,
                                                             Authentication authentication) {
        apiKeyService.deactivateKey(getUserId(authentication), keyId);
        return ResponseEntity.ok(ApiResponse.ok("Key Deactivated"));
    }
}
