package com.x402.auth_service.service;

import com.x402.auth_service.entity.User;
import com.x402.auth_service.repository.UserRepository;
import com.x402.auth_service.security.JwtProvider;
import com.x402.common.dto.UserDTO;
import com.x402.common.exceptions.ResourceNotFoundException;
import com.x402.common.exceptions.UnauthorizedException;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final JwtProvider jwtProvider;

    private static final String WALLET_REGEX = "^0x[a-fA-F0-9]{40}$";
    private static final Pattern WALLET_PATTERN = Pattern.compile(WALLET_REGEX);

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

    @Transactional
    public UserDTO updateRole(Long id, User.Role newRole)
    {
        User user = userRepository.findById(id)
                .orElseThrow(()->new ResourceNotFoundException("User not found: " + id));
        user.setRole(newRole);
        userRepository.save(user);
        return toDTO(user);
    }

    @Transactional
    public UserDTO linkWallet(Long userId, String walletAddress)
    {


        if (walletAddress == null || !WALLET_PATTERN.matcher(walletAddress).matches()) {
            throw new IllegalArgumentException("Invalid wallet address format.");
        }
        User user = userRepository.findById(userId).orElseThrow(()-> new ResourceNotFoundException("User not found: " + userId));
        user.setWalletAddress(walletAddress.toUpperCase());
        userRepository.save(user);
        return toDTO(user);
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
