package com.x402.auth_service.security;


import com.x402.auth_service.entity.RefreshToken;
import com.x402.auth_service.entity.User;
import com.x402.auth_service.repository.RefreshTokenRepository;
import com.x402.auth_service.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtProvider jwtProvider;
    private final AuthCodeStore authCodeStore;
    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${app.frontend-url}")
    private String frontendUrl;


    @Override
    public void  onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException
    {
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oAuth2User = oauthToken.getPrincipal();

        String registrationId = oauthToken.getAuthorizedClientRegistrationId();

        User.OAuthProvider provider = User.OAuthProvider.valueOf(registrationId.toUpperCase());

        String oauthId = extractOAuthId(oAuth2User, provider);
        String name = extractName(oAuth2User, provider);
        String email =  extractEmail(oAuth2User, provider);
        String avatarUrl = extractAvatar(oAuth2User, provider);

        User user = userRepository.findByAuthProviderAndOauthId(provider,oauthId)
                .map(existingUser->
                {
                    existingUser.setName(name);
                    existingUser.setAvatarUrl(avatarUrl);
                    if (email != null) {
                        existingUser.setEmail(email);
                    }
                    return userRepository.save(existingUser);
                })
                .orElseGet(()->{
                    User newUser = User.builder()
                            .email(email)
                            .name(name)
                            .avatarUrl(avatarUrl)
                            .authProvider(provider)
                            .oauthId(oauthId)
                            .role(User.Role.BOTH)
                            .build();
                    return userRepository.save(newUser);
                });
        String accessToken = jwtProvider.generateAccessToken(user);
        String refreshToken = jwtProvider.generateRefreshToken(user);
        RefreshToken refreshTokenEntity = RefreshToken.builder()
                            .userId(user.getId())
                            .token(refreshToken)
                            .used(false)
                            .build();
        refreshTokenRepository.save(refreshTokenEntity);

        String code = authCodeStore.storeTokens(accessToken, refreshToken);

       String redirectUrl = String.format("%s/auth/callback?code=%s", frontendUrl, code);

       /* String redirectUrl = String.format(
                "%s/auth/callback?token=%s&refresh=%s",
                frontendUrl, accessToken, refreshToken
        );*/
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }

    private String extractOAuthId(OAuth2User user, User.OAuthProvider provider) {

        return switch(provider)
        {
            case GOOGLE -> user.getAttribute("sub");
            case GITHUB ->  String.valueOf(user.<Integer>getAttribute("id"));
        };
    }

    private String extractEmail(OAuth2User user, User.OAuthProvider provider) {

        if(provider == User.OAuthProvider.GOOGLE)
        {
            return user.getAttribute("email");
        } else if (provider == User.OAuthProvider.GITHUB) {

            if(user.getAttribute("email") != null)
            {
                return user.getAttribute("email");
            }
            else
            {
                return user.getAttribute("login") + "@github-private.local";
            }
        }
        return null;

    }

    private String extractName(OAuth2User user, User.OAuthProvider provider) {
        return switch(provider)
        {
            case GOOGLE -> user.getAttribute("name");
            case GITHUB -> {
                String name = user.getAttribute("name");
                yield (name!=null)? name: user.getAttribute("login");
            }
        };
    }

    private String extractAvatar(OAuth2User user, User.OAuthProvider provider) {
        return switch(provider)
        {
            case GOOGLE -> user.getAttribute("picture");
            case GITHUB -> user.getAttribute("avatar_url");
        };
    }
}
