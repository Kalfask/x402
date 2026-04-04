package com.x402.auth_service.repository;

import com.x402.auth_service.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByAuthProviderAndOauthId(User.OAuthProvider authProvider, String oauthId);
    Optional<User> findByEmail(String email);
    Optional<User> findByWalletAddress(String walletAddress);
    boolean existsByEmail(String email);
}
