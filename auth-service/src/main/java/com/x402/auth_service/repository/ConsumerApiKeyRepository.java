package com.x402.auth_service.repository;

import com.x402.auth_service.entity.ConsumerApiKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConsumerApiKeyRepository extends JpaRepository<ConsumerApiKey, Long> {

    Optional<ConsumerApiKey> findByApiKeyAndActiveTrue(String apiKey);

    List<ConsumerApiKey> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserId(Long userId);
}
