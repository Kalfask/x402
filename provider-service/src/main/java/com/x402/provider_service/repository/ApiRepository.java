package com.x402.provider_service.repository;

import com.x402.provider_service.entity.Api;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApiRepository extends JpaRepository<Api, Long> {

    //Find all APIs owned by a specific provider
    List<Api> findByProviderId(Long providerId);

    //Find all active APIs (for marketplace search)
    List<Api> findByStatus(Api.Status status);

    //Search marketplace by name or category
    List<Api> findByStatusAndNameContainingIgnoreCase(Api.Status status, String name);

    List<Api> findByStatusAndCategory(Api.Status status, String category);
}
