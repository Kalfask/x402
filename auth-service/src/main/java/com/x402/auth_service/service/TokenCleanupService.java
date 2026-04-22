package com.x402.auth_service.service;

import com.x402.auth_service.repository.RefreshTokenRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TokenCleanupService {
    private final RefreshTokenRepository refreshTokenRepository;

    @Scheduled(fixedRate = 86400000)
    @Transactional
    public void cleanupOldTokens() {
        refreshTokenRepository.deleteUsedTokensOlderThan(
                java.time.LocalDateTime.now().minusDays(7));
    }
}
