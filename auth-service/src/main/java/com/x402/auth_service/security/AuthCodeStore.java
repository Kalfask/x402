package com.x402.auth_service.security;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AuthCodeStore {
    private final ConcurrentHashMap<String, CodeEntry> codeStore= new ConcurrentHashMap<>();


   public String storeTokens(String accessToken, String refreshToken) {
       String randomCode = UUID.randomUUID().toString();
       CodeEntry entry = new CodeEntry(accessToken,refreshToken, System.currentTimeMillis());
       codeStore.put(randomCode, entry);
       return  randomCode;
   }

   public Map<String, String> exchangeCode(String code) {
       CodeEntry entry = codeStore.get(code);
       if (entry == null) {return null;}

       if (System.currentTimeMillis() - entry.getCreatedAt() > 30_000) {
           return null; // Code expired
       }
       String accessToken = entry.getAccessToken();
       String refreshToken = entry.getRefreshToken();
       codeStore.remove(code);
       return Map.of(
               "accessToken",  accessToken,
               "refreshToken", refreshToken
       );
   }

   @Scheduled(fixedRate = 60000)
   public void cleanup()
   {
        Long now = System.currentTimeMillis();
        codeStore.values().removeIf(entry -> now - entry.getCreatedAt() > 30_000);
   }

    @Data
    @AllArgsConstructor
    private static class CodeEntry{
        String accessToken;
        String refreshToken;
        Long createdAt;

        /*public CodeEntry(String accessToken, String refreshToken){
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            this.createdAt = System.currentTimeMillis();

        }

        public String getAccessToken() {
            return accessToken;
        }

        public void setAccessToken(String accessToken) {
            this.accessToken = accessToken;
        }

        public String getRefreshToken() {
            return refreshToken;
        }

        public void setRefreshToken(String refreshToken) {
            this.refreshToken = refreshToken;
        }

        public Long getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(Long createdAt) {
            this.createdAt = createdAt;
        }*/
    }
}
