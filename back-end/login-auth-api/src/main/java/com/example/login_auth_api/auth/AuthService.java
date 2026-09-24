package com.example.login_auth_api.auth;

import com.example.login_auth_api.auth.AuthDtos.LoginRequest;
import com.example.login_auth_api.auth.AuthDtos.LoginResponse;
import com.example.login_auth_api.auth.AuthDtos.UserResponse;
import com.example.login_auth_api.domain.audit.AuditAction;
import com.example.login_auth_api.domain.audit.AuditService;
import com.example.login_auth_api.domain.base.Base;
import com.example.login_auth_api.domain.base.BaseRepository;
import com.example.login_auth_api.domain.user.User;
import com.example.login_auth_api.domain.user.UserRepository;
import com.example.login_auth_api.exception.ApiException;
import com.example.login_auth_api.security.TokenService;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * Fluxo de login. Não é transacional de propósito: as tentativas que falham
 * também precisam ficar gravadas no log de auditoria.
 */
@Service
public class AuthService {

    private static final String INVALID_CREDENTIALS = "Usuário ou senha inválidos.";

    private final AuthenticationManager authenticationManager;
    private final BaseRepository baseRepository;
    private final UserRepository userRepository;
    private final TokenService tokenService;
    private final AuditService auditService;

    public AuthService(AuthenticationManager authenticationManager,
                       BaseRepository baseRepository,
                       UserRepository userRepository,
                       TokenService tokenService,
                       AuditService auditService) {
        this.authenticationManager = authenticationManager;
        this.baseRepository = baseRepository;
        this.userRepository = userRepository;
        this.tokenService = tokenService;
        this.auditService = auditService;
    }

    public LoginResponse login(LoginRequest request, String ipAddress) {
        String login = request.login().trim();

        Base base = baseRepository.findByCodeAndActiveTrue(request.baseCode())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Base de operação inválida."));

        User user;
        try {
            var authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(login, request.password()));
            user = (User) authentication.getPrincipal();
        } catch (BadCredentialsException e) {
            auditService.record(null, AuditAction.LOGIN_FALHOU, "USER", null, "login=" + login, ipAddress);
            throw new ApiException(HttpStatus.UNAUTHORIZED, INVALID_CREDENTIALS);
        }

        if (!user.isActive()) {
            auditService.record(user.getId(), AuditAction.LOGIN_USUARIO_INATIVO, "USER", user.getId(), null, ipAddress);
            throw new ApiException(HttpStatus.FORBIDDEN, "Usuário inativo. Procure o administrador do sistema.");
        }

        if (!user.canAccess(base)) {
            auditService.record(user.getId(), AuditAction.LOGIN_NEGADO_BASE, "USER", user.getId(),
                    "base=" + base.getCode(), ipAddress);
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Você não tem acesso à base " + base.getCode() + ". Selecione uma base autorizada.");
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);
        auditService.record(user.getId(), AuditAction.LOGIN, "USER", user.getId(), "base=" + base.getCode(), ipAddress);

        TokenService.IssuedToken token = tokenService.generate(user, base);
        return new LoginResponse(token.token(), token.expiresAt(), UserResponse.from(user, base));
    }

    public UserResponse currentUser(User user, String baseCode) {
        Base base = baseRepository.findByCodeAndActiveTrue(baseCode)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Base da sessão não está mais ativa."));
        return UserResponse.from(user, base);
    }
}
