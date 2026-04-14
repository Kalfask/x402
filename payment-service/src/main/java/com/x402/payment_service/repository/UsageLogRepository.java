package com.x402.payment_service.repository;

import com.x402.payment_service.entity.UsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@RestController
public interface UsageLogRepository extends JpaRepository<UsageLog, Long> {

    // Replay attack check
    Optional<UsageLog> findByTxHash(String txHash);
    // Consumer usage history
    List<UsageLog> findByConsumerIdOrderByCalledAtDesc(Long consumerId);
    // Provider earnings
    List<UsageLog> findByProviderIdAndStatusOrderByCalledAtDesc(
            Long providerId, UsageLog.PaymentStatus status);
    // Usage for a specific API (owner only)
    List<UsageLog> findByApiIdAndProviderIdOrderByCalledAtDesc(
            Long apiId, Long providerId);
    // Total earnings for a provider (confirmed payments only)
    @Query("SELECT COALESCE(SUM(u.price), 0) FROM UsageLog u " +
            "WHERE u.providerId = :providerId AND u.status = 'CONFIRMED'")
    BigDecimal getTotalEarnings(Long providerId);
    // Total spent by a consumer
    @Query("SELECT COALESCE(SUM(u.price), 0) FROM UsageLog u " +
            "WHERE u.consumerId = :consumerId AND u.status = 'CONFIRMED'")
    BigDecimal getTotalSpent(Long consumerId);

}
