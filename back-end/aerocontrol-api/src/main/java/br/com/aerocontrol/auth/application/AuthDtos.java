package br.com.aerocontrol.auth.application;

import br.com.aerocontrol.base.application.BaseDtos.BaseResponse;
import br.com.aerocontrol.base.domain.Base;
import br.com.aerocontrol.user.domain.Permission;
import br.com.aerocontrol.user.domain.User;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;
import java.util.List;

/**
 * Objetos de entrada e saída da API de autenticação.
 */
public final class AuthDtos {

    private AuthDtos() {
    }

    public record LoginRequest(
            @NotBlank(message = "Selecione a base de operação.") String baseCode,
            @NotBlank(message = "Informe sua matrícula ou e-mail.") String login,
            @NotBlank(message = "Informe sua senha.") String password) {
    }

    public record LoginResponse(String token, Instant expiresAt, UserResponse user) {
    }

    public record PermissionResponse(String code, String description) {
        static PermissionResponse from(Permission permission) {
            return new PermissionResponse(permission.name(), permission.getDescription());
        }
    }

    public record UserResponse(
            Long id,
            String name,
            String email,
            String registration,
            String role,
            String roleLabel,
            BaseResponse base,
            List<PermissionResponse> permissions) {

        public static UserResponse from(User user, Base currentBase) {
            return new UserResponse(
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getRegistration(),
                    user.getRole().name(),
                    user.getRole().getLabel(),
                    BaseResponse.from(currentBase),
                    user.getRole().getPermissions().stream().map(PermissionResponse::from).toList());
        }
    }
}
