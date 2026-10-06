package br.com.aerocontrol.security;

import br.com.aerocontrol.user.domain.User;
import br.com.aerocontrol.user.domain.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Lê o token "Bearer" do cabeçalho Authorization e autentica a requisição.
 * O usuário é recarregado do banco para que um usuário desativado perca o acesso na hora.
 */
public class SecurityFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final TokenService tokenService;
    private final UserRepository userRepository;

    public SecurityFilter(TokenService tokenService, UserRepository userRepository) {
        this.tokenService = tokenService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (header != null && header.startsWith(BEARER_PREFIX)) {
            tokenService.validate(header.substring(BEARER_PREFIX.length()))
                    .flatMap(claims -> userRepository.findById(claims.userId())
                            .filter(User::isActive)
                            .map(user -> new AuthenticatedSession(user, claims.baseCode())))
                    .ifPresent(session -> {
                        var authentication = new UsernamePasswordAuthenticationToken(
                                session, null, session.user().getAuthorities());
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    });
        }

        chain.doFilter(request, response);
    }
}
