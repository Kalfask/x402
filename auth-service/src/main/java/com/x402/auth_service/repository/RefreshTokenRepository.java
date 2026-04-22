package com.x402.auth_service.repository;

import com.x402.auth_service.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    RefreshToken findByToken(String token);

    RefreshToken findByUserId(Long userId);

    List<RefreshToken> findAllByUserId(Long userId);

    void deleteByUserId(Long userId);
}
