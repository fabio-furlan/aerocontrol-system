package br.com.aerocontrol.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import br.com.aerocontrol.base.domain.Base;
import br.com.aerocontrol.user.domain.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

/**
 * Emite e valida os tokens de acesso (JWT assinado com HMAC-SHA256).
 */
@Service
public class TokenService {

    static final String CLAIM_ROLE = "role";
    static final String CLAIM_BASE = "base";

    private final Algorithm algorithm;
    private final JWTVerifier verifier;
    private final String issuer;
    private final Duration expiration;

    public TokenService(@Value("${app.jwt.secret}") String secret,
                        @Value("${app.jwt.issuer}") String issuer,
                        @Value("${app.jwt.expiration-hours}") long expirationHours) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("app.jwt.secret (JWT_SECRET) não configurado");
        }
        this.algorithm = Algorithm.HMAC256(secret);
        this.verifier = JWT.require(algorithm).withIssuer(issuer).build();
        this.issuer = issuer;
        this.expiration = Duration.ofHours(expirationHours);
    }

    public IssuedToken generate(User user, Base base) {
        Instant expiresAt = Instant.now().plus(expiration);
        String token = JWT.create()
                .withIssuer(issuer)
                .withSubject(user.getId().toString())
                .withClaim(CLAIM_ROLE, user.getRole().name())
                .withClaim(CLAIM_BASE, base.getCode())
                .withIssuedAt(Instant.now())
                .withExpiresAt(expiresAt)
                .sign(algorithm);
        return new IssuedToken(token, expiresAt);
    }

    /** Retorna o conteúdo do token se ele for válido (assinatura, emissor e validade). */
    public Optional<TokenClaims> validate(String token) {
        try {
            DecodedJWT jwt = verifier.verify(token);
            return Optional.of(new TokenClaims(
                    Long.valueOf(jwt.getSubject()),
                    jwt.getClaim(CLAIM_BASE).asString()));
        } catch (JWTVerificationException | NumberFormatException e) {
            return Optional.empty();
        }
    }

    public record IssuedToken(String token, Instant expiresAt) {
    }

    public record TokenClaims(Long userId, String baseCode) {
    }
}
