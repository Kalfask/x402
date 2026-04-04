package com.x402.auth_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private  Long id;
    @Column(nullable = false, unique = true)
    private String email;
    private String name;
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OAuthProvider authProvider;

    @Column(nullable = false)
    private String oauthId;

    @Column(length = 42)
    private String walletAddress;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Role role = Role.BOTH;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;


    public enum OAuthProvider {
        GOOGLE, GITHUB
    }

    public enum Role {
        PROVIDER, CONSUMER, BOTH
    }

}
