package com.x402.auth_service.entity;

import jakarta.annotation.Nullable;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "consumer_api_keys")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsumerApiKey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, unique = true,length = 64)
    private String apiKey;

    @Column(nullable = false)
    private String name;

    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime lastUsedAt;

}
