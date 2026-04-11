package com.x402.provider_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;


@Entity
@Table(name = "endpoints")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Endpoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "api_id",nullable = false)
    private Api api;

    @Column(nullable = false)
    private String path;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HttpMethod method;

    private String description;

    @Column(nullable = false, precision = 18, scale = 6)
    private BigDecimal pricePerCall;

    @Builder.Default
    private Boolean isActive = true;


    public enum HttpMethod{
        GET, POST, PUT, DELETE
    }
}
