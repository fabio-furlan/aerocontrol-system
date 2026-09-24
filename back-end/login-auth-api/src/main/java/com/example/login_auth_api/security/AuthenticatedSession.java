package com.example.login_auth_api.security;

import com.example.login_auth_api.domain.user.User;

/**
 * Usuário autenticado na requisição atual e a base escolhida no login.
 */
public record AuthenticatedSession(User user, String baseCode) {
}
