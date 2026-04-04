package com.x402.auth_service.security;

import com.x402.auth_service.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
@Slf4j
public class JwtProvider {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private Long jwtExpiration;

    @Value("${app.jwt.refresh-expiration-ms}")
    private Long refreshTokenExpiration;

    private SecretKey key;

    @PostConstruct
    public void init() {
        key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(User user)
    {
        String jwt = Jwts.builder()
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("name", user.getName())
                .claim("role", user.getRole().name())
                .claim("walletAddress", user.getWalletAddress())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis()+jwtExpiration))
                .signWith(key)
                .compact();

        return jwt;
    }

    public String generateRefreshToken(User user)
    {
        String refreshJwt = Jwts.builder()
                .subject(user.getId().toString())
                .claim("type", "refresh")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis()+refreshTokenExpiration))
                .signWith(key)
                .compact();
        return refreshJwt;
    }

    public Long getUserIdFromToken(String token)
    {
        Claims claims = getClaims(token);
        Long userId = Long.valueOf(claims.getSubject());
        return userId;
    }

    private Claims parseToken(String token)
    {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Claims getClaims(String token)
    {
        return parseToken(token);
    }

    public boolean validateToken(String token)
    {
        try {
            Claims claims = parseToken(token);
            return true;
        }
        catch (Exception e)
        {
            return false;
        }
    }

}
