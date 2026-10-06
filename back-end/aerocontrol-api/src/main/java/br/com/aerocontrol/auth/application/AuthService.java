package br.com.aerocontrol.auth.application;

import br.com.aerocontrol.auth.application.AuthDtos.LoginRequest;
import br.com.aerocontrol.auth.application.AuthDtos.LoginResponse;
import br.com.aerocontrol.auth.application.AuthDtos.UserResponse;
import br.com.aerocontrol.base.application.BaseService;
import br.com.aerocontrol.base.domain.Base;
import br.com.aerocontrol.security.TokenService;
import br.com.aerocontrol.shared.audit.AuditAction;
import br.com.aerocontrol.shared.audit.AuditService;
import br.com.aerocontrol.shared.exception.ApiException;
import br.com.aerocontrol.user.application.UserService;
import br.com.aerocontrol.user.domain.User;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

/**
 * Fluxo de login. Não é transacional de propósito: as tentativas que falham
 * também precisam ficar gravadas no log de auditoria.
 */
@Service
public class AuthService {

    private static final String INVALID_CREDENTIALS = "Usuário ou senha inválidos.";

    private final AuthenticationManager authenticationManager;
    private final BaseService baseService;
    private final UserService userService;
    private final TokenService tokenService;
    private final AuditService auditService;

    public AuthService(AuthenticationManager authenticationManager,
                       BaseService baseService,
                       UserService userService,
                       TokenService tokenService,
                       AuditService auditService) {
        this.authenticationManager = authenticationManager;
        this.baseService = baseService;
        this.userService = userService;
        this.tokenService = tokenService;
        this.auditService = auditService;
    }

    public LoginResponse login(LoginRequest request, String ipAddress) {
        String login = request.login().trim();

        Base base = baseService.findActiveByCode(request.baseCode())
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

        userService.recordLogin(user);
        auditService.record(user.getId(), AuditAction.LOGIN, "USER", user.getId(), "base=" + base.getCode(), ipAddress);

        TokenService.IssuedToken token = tokenService.generate(user, base);
        return new LoginResponse(token.token(), token.expiresAt(), UserResponse.from(user, base));
    }

    public UserResponse currentUser(User user, String baseCode) {
        Base base = baseService.findActiveByCode(baseCode)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Base da sessão não está mais ativa."));
        return UserResponse.from(user, base);
    }
}
