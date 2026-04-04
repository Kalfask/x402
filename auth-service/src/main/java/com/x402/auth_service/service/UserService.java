package com.x402.auth_service.service;

import com.x402.auth_service.entity.User;
import com.x402.auth_service.repository.UserRepository;
import com.x402.auth_service.security.JwtProvider;
import com.x402.common.dto.UserDTO;
import com.x402.common.exceptions.ResourceNotFoundException;
import com.x402.common.exceptions.UnauthorizedException;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class UserService {

    private UserRepository userRepository;
    private final JwtProvider jwtProvider;

    public UserDTO getUserById(Long id)
    {
        User user = userRepository.findById(id)
                .orElseThrow(()->new ResourceNotFoundException("User not found: " + id));
        return toDTO(user);
    }


    public String refreshAccessToken(String refreshToken)
    {
        if(!jwtProvider.validateToken(refreshToken))
        {
            throw new UnauthorizedException("Invalid Refresh Token");
        }
        Long userId = jwtProvider.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(userId).orElseThrow(()->new ResourceNotFoundException("User not found: " + userId));
        return jwtProvider.generateAccessToken(user);
    }

    //Helpers
    private  UserDTO toDTO(User user)
    {
        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole().name())
                .walletAddress(user.getWalletAddress())
                .build();
    }
}
