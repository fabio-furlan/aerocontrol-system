package br.com.aerocontrol.security;

import br.com.aerocontrol.user.domain.User;

/**
 * Usuário autenticado na requisição atual e a base escolhida no login.
 */
public record AuthenticatedSession(User user, String baseCode) {
}
