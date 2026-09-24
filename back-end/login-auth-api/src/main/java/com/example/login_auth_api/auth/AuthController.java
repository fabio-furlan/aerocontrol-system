package com.example.login_auth_api.auth;

import com.example.login_auth_api.auth.AuthDtos.LoginRequest;
import com.example.login_auth_api.auth.AuthDtos.LoginResponse;
import com.example.login_auth_api.auth.AuthDtos.UserResponse;
import com.example.login_auth_api.security.AuthenticatedSession;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody @Valid LoginRequest request, HttpServletRequest http) {
        return authService.login(request, http.getRemoteAddr());
    }

    /** Dados do usuário logado; usado pelo front-end para validar a sessão salva. */
    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal AuthenticatedSession session) {
        return authService.currentUser(session.user(), session.baseCode());
    }
}
