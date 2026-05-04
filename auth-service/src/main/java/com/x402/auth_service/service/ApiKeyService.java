package com.x402.auth_service.service;

import com.x402.auth_service.entity.ConsumerApiKey;
import com.x402.auth_service.repository.ConsumerApiKeyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ApiKeyService {

    private final ConsumerApiKeyRepository repo;
    private final PasswordEncoder passwordEncoder;

    private static final int MAX_KEYS_PER_USER = 20;

    public ConsumerApiKey createApiKey(Long userId, String name) {
        if(repo.countByUserId(userId) >= MAX_KEYS_PER_USER)
            throw new RuntimeException("Maximum " + MAX_KEYS_PER_USER + " keys per user allowed");

        String key = generateKey();

        String keyPrefix = key.substring(0, 16) + "...";

        String hashedKey = passwordEncoder.encode(key);

        ConsumerApiKey apiKey =  ConsumerApiKey
                .builder()
                .userId(userId)
                .apiKey(hashedKey)
                .keyPrefix(keyPrefix)
                .name(name)
                .build();
            ConsumerApiKey savedApiKey = repo.save(apiKey);
        ConsumerApiKey ApiKeyDto = ConsumerApiKey
                .builder()
                .id(savedApiKey.getId())
                .userId(userId)
                .apiKey(key)
                .keyPrefix(keyPrefix)
                .name(name)
                .build();

        return ApiKeyDto;
    }


    public List<ConsumerApiKey> getMyKeys(Long userId)
    {

        return  repo.findByUserIdOrderByCreatedAtDesc(userId);
    }



    public ConsumerApiKey validateKey(String key)
    {
        ConsumerApiKey apiKey = repo.findByActiveTrue()
                .stream()
                .filter(k->passwordEncoder.matches(key,k.getApiKey()))
                .findFirst()
                .orElse(null);

        if(apiKey != null)
        {
            apiKey.setLastUsedAt(LocalDateTime.now());
            repo.save(apiKey);
        }
        return apiKey;
    }

    public void deactivateKey(Long userId, Long keyId)
    {
        ConsumerApiKey apiKey = repo.findById(keyId)
                .orElseThrow(()->new RuntimeException("key not found"));

        if(!apiKey.getUserId().equals(userId))
        {
            throw new RuntimeException("user not allowed to deactivate key");
        }

        apiKey.setActive(false);
        repo.save(apiKey);
    }


    private String generateKey() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return "x402_sk_" + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
