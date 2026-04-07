package com.x402.provider_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.context.annotation.Bean;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "apis")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Api {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private Long providerId;

    @Column(nullable = false)
    private String Name;

    @Column(columnDefinition = "TEXT")
    private String Description;

    @Column(nullable = false)
    private String baseUrl;

    private String category;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.DRAFT;

    @OneToMany(mappedBy = "api", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Endpoint> endpoints = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;



    public enum Status {
        DRAFT,
        ACTIVE,
        PAUSED,
        DISABLED
    }
}
