package com.x402.auth_service.controller;

import com.x402.auth_service.entity.User;
import com.x402.auth_service.service.UserService;
import com.x402.common.dto.ApiResponse;
import com.x402.common.dto.UserDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserService userService;


    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> getCurrentUser(Authentication auth){
        Long UserId = Long.parseLong(auth.getName());
        UserDTO user= userService.getUserById(UserId);
        return ResponseEntity.ok(ApiResponse.ok(user));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Map<String,String>>> refreshToken(@RequestBody Map<String,String> body){
        String refreshToken = body.get("refreshToken");
        String newAccessToken = userService.refreshAccessToken(refreshToken);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("accessToken",newAccessToken),"Token refreshed"));
    }

    @PatchMapping("/role")
    public ResponseEntity<ApiResponse<Map<String,String>>> updateRole(@RequestBody Map<String,String> body,Authentication auth){
        Long userId = Long.parseLong(auth.getName());
        String role = body.get("role");
        User.Role newRole = User.Role.valueOf(role.toUpperCase());
        UserDTO user = userService.updateRole(userId,newRole);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("role", user.getRole()),"Role updated"));
    }

    @PatchMapping("/wallet")
    public ResponseEntity<ApiResponse<Map<String,String>>> updateWallet(@RequestBody Map<String,String> body,Authentication auth){
        Long UserId = Long.parseLong(auth.getName());
        String walletAddress = body.get("walletAddress");
        UserDTO user = userService.linkWallet(UserId,walletAddress);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("walletAddress",user.getWalletAddress()),"Wallet updated"));
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health(){
        return ResponseEntity.ok(ApiResponse.ok("Auth Service is running"));
    }
}
