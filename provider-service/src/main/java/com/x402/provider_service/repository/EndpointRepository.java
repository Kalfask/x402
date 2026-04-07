package com.x402.provider_service.repository;


import com.x402.provider_service.entity.Endpoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EndpointRepository extends JpaRepository<Endpoint, Long> {

    //Find all endpoints for a given api
    List<Endpoint> findByApiId(Long ApiId);

    //find only active endpoints for an API
    List<Endpoint> findByApiIdAndIsActive(Long ApiId, Boolean isActive);
}
