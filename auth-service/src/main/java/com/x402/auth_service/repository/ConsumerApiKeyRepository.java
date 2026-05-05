package com.x402.auth_service.repository;

import com.x402.auth_service.entity.ConsumerApiKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConsumerApiKeyRepository extends JpaRepository<ConsumerApiKey, Long> {

    List<ConsumerApiKey> findByKeyPrefixAndActiveTrue(String keyPrefix);

    List<ConsumerApiKey> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserId(Long userId);
}
