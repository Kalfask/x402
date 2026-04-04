package com.x402.common.security;

import com.x402.common.exceptions.UnauthorizedException;
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

@Component
@Slf4j
public class JwtValidator {
    @Value("${app.jwt.secret}")
    private String jwtSecret;

    private SecretKey secretKey;

    @PostConstruct
    private void init()
    {
         secretKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public boolean validateToken(String token)
    {
        try{
            parseToken(token);
            return true;
        }
        catch (Exception e)
            {
                log.warn(e.getMessage());
                return false;
            }

    }

    private  Claims parseToken(String token)
    {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }


    public Claims getClaims(String token)
    {
        return parseToken(token);
    }


    public Long getUserId(String token)
    {
        return Long.parseLong(getClaims(token).getSubject());
    }


}
