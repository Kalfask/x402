package com.x402.payment_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name="usage_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsageLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long consumerId;

    @Column(nullable = false)
    private Long endpointId;

    @Column(nullable = false)
    private Long apiId;

    @Column(nullable = false)
    private Long providerId;

    @Column(nullable = false, precision = 18, scale = 6)
    private BigDecimal price;

    @Column(length = 66, unique = true)
    private String txHash;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    @CreationTimestamp
    private LocalDateTime calledAt;

    public enum PaymentStatus {
        PENDING, CONFIRMED, FAILED
    }
}
