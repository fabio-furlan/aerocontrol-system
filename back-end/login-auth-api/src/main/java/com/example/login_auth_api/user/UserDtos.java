package com.example.login_auth_api.user;

import com.example.login_auth_api.domain.base.Base;
import com.example.login_auth_api.domain.user.Permission;
import com.example.login_auth_api.domain.user.Role;
import com.example.login_auth_api.domain.user.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

/**
 * Objetos de entrada e saída do cadastro de usuários.
 */
public final class UserDtos {

    private UserDtos() {
    }

    /**
     * Dados para criar ou editar um usuário. A senha é obrigatória só na criação;
     * na edição, se vier preenchida, redefine a senha do usuário.
     */
    public record UserRequest(
            @NotBlank(message = "Informe o nome.")
            @Size(max = 120, message = "O nome deve ter até 120 caracteres.")
            String name,

            @NotBlank(message = "Informe o e-mail.")
            @Email(message = "Informe um e-mail válido.")
            @Size(max = 160, message = "O e-mail deve ter até 160 caracteres.")
            String email,

            @NotBlank(message = "Informe a matrícula.")
            @Size(max = 20, message = "A matrícula deve ter até 20 caracteres.")
            String registration,

            @NotNull(message = "Selecione o perfil de acesso.")
            Role role,

            @Size(max = 30, message = "A licença deve ter até 30 caracteres.")
            String licenseNumber,

            @NotEmpty(message = "Selecione ao menos uma base.")
            List<String> baseCodes,

            String password) {
    }

    public record StatusRequest(@NotNull(message = "Informe o status.") Boolean active) {
    }

    public record UserResponse(
            Long id,
            String name,
            String email,
            String registration,
            String role,
            String roleLabel,
            String licenseNumber,
            List<String> baseCodes,
            boolean active,
            Instant lastLoginAt,
            Instant createdAt,
            boolean hasPhoto) {

        public static UserResponse from(User user, boolean hasPhoto) {
            return new UserResponse(
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getRegistration(),
                    user.getRole().name(),
                    user.getRole().getLabel(),
                    user.getLicenseNumber(),
                    user.getBases().stream().map(Base::getCode).sorted().toList(),
                    user.isActive(),
                    user.getLastLoginAt(),
                    user.getCreatedAt(),
                    hasPhoto);
        }
    }

    public record PermissionResponse(String code, String description) {
    }

    /** Perfil com as permissões que ele concede, para a matriz de permissões da tela. */
    public record RoleResponse(String code, String label, List<String> permissions) {

        static RoleResponse from(Role role) {
            return new RoleResponse(role.name(), role.getLabel(),
                    role.getPermissions().stream().map(Permission::name).toList());
        }
    }

    public record RolesResponse(List<RoleResponse> roles, List<PermissionResponse> permissions) {

        static RolesResponse all() {
            return new RolesResponse(
                    Arrays.stream(Role.values()).map(RoleResponse::from).toList(),
                    Arrays.stream(Permission.values())
                            .map(p -> new PermissionResponse(p.name(), p.getDescription()))
                            .toList());
        }
    }
}
