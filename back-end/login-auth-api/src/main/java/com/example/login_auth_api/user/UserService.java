package com.example.login_auth_api.user;

import com.example.login_auth_api.domain.audit.AuditAction;
import com.example.login_auth_api.domain.audit.AuditService;
import com.example.login_auth_api.domain.base.Base;
import com.example.login_auth_api.domain.base.BaseRepository;
import com.example.login_auth_api.domain.user.Role;
import com.example.login_auth_api.domain.user.User;
import com.example.login_auth_api.domain.user.UserPhoto;
import com.example.login_auth_api.domain.user.UserPhotoRepository;
import com.example.login_auth_api.domain.user.UserRepository;
import com.example.login_auth_api.exception.ApiException;
import com.example.login_auth_api.photo.PhotoUpload;
import com.example.login_auth_api.user.UserDtos.UserRequest;
import com.example.login_auth_api.user.UserDtos.UserResponse;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class UserService {

    /** Mínimo de 8 caracteres, com ao menos uma letra e um número. */
    private static final Pattern PASSWORD_POLICY = Pattern.compile("^(?=.*[A-Za-z])(?=.*\\d).{8,72}$");
    private static final String PASSWORD_POLICY_MESSAGE = "A senha deve ter de 8 a 72 caracteres, com letras e números.";
    private static final String ENTITY = "USER";

    private final UserRepository userRepository;
    private final UserPhotoRepository photoRepository;
    private final BaseRepository baseRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public UserService(UserRepository userRepository,
                       UserPhotoRepository photoRepository,
                       BaseRepository baseRepository,
                       PasswordEncoder passwordEncoder,
                       AuditService auditService) {
        this.userRepository = userRepository;
        this.photoRepository = photoRepository;
        this.baseRepository = baseRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> list(String search, Role role, Boolean active) {
        Set<Long> withPhoto = photoRepository.findUserIdsWithPhoto();
        return userRepository.findAll(UserSpecifications.matches(search, role, active), Sort.by("name"))
                .stream().map(u -> UserResponse.from(u, withPhoto.contains(u.getId()))).toList();
    }

    @Transactional(readOnly = true)
    public UserResponse get(Long id) {
        return response(find(id));
    }

    @Transactional
    public UserResponse create(UserRequest request, User actor, String ip) {
        Map<String, String> errors = validate(request, null);
        if (request.password() == null || request.password().isBlank()) {
            errors.putIfAbsent("password", "Informe a senha inicial.");
        }
        Set<Base> bases = resolveBases(request.baseCodes(), errors);
        throwIfInvalid(errors);

        User user = new User(
                request.name().trim(),
                normalizeEmail(request.email()),
                normalizeRegistration(request.registration()),
                passwordEncoder.encode(request.password()),
                request.role());
        user.setLicenseNumber(blankToNull(request.licenseNumber()));
        user.getBases().addAll(bases);
        userRepository.save(user);

        auditService.record(actor.getId(), AuditAction.USUARIO_CRIADO, ENTITY, user.getId(),
                "matrícula=" + user.getRegistration() + "; perfil=" + user.getRole()
                        + "; bases=" + codes(user.getBases()), ip);
        return UserResponse.from(user, false);
    }

    @Transactional
    public UserResponse update(Long id, UserRequest request, User actor, String ip) {
        User user = find(id);
        Map<String, String> errors = validate(request, id);
        Set<Base> bases = resolveBases(request.baseCodes(), errors);
        throwIfInvalid(errors);

        if (user.getRole() == Role.ENGENHEIRO && request.role() != Role.ENGENHEIRO) {
            if (user.getId().equals(actor.getId())) {
                throw conflict("Você não pode alterar o seu próprio perfil de acesso.");
            }
            ensureAnotherActiveEngineer(user);
        }

        List<String> changes = new ArrayList<>();
        String email = normalizeEmail(request.email());
        String registration = normalizeRegistration(request.registration());
        String license = blankToNull(request.licenseNumber());

        track(changes, "nome", user.getName(), request.name().trim());
        track(changes, "e-mail", user.getEmail(), email);
        track(changes, "matrícula", user.getRegistration(), registration);
        track(changes, "perfil", user.getRole().name(), request.role().name());
        track(changes, "licença", user.getLicenseNumber(), license);
        track(changes, "bases", codes(user.getBases()), codes(bases));

        user.setName(request.name().trim());
        user.setEmail(email);
        user.setRegistration(registration);
        user.setRole(request.role());
        user.setLicenseNumber(license);
        user.getBases().clear();
        user.getBases().addAll(bases);

        if (!changes.isEmpty()) {
            auditService.record(actor.getId(), AuditAction.USUARIO_ALTERADO, ENTITY, user.getId(),
                    String.join("; ", changes), ip);
        }
        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
            auditService.record(actor.getId(), AuditAction.SENHA_REDEFINIDA, ENTITY, user.getId(), null, ip);
        }
        return response(user);
    }

    @Transactional
    public UserResponse changeStatus(Long id, boolean active, User actor, String ip) {
        User user = find(id);
        if (user.isActive() == active) {
            return response(user);
        }
        if (!active) {
            if (user.getId().equals(actor.getId())) {
                throw conflict("Você não pode desativar o seu próprio usuário.");
            }
            if (user.getRole() == Role.ENGENHEIRO) {
                ensureAnotherActiveEngineer(user);
            }
        }

        user.setActive(active);
        auditService.record(actor.getId(), active ? AuditAction.USUARIO_ATIVADO : AuditAction.USUARIO_DESATIVADO,
                ENTITY, user.getId(), null, ip);
        return response(user);
    }

    // ---- foto ----

    @Transactional(readOnly = true)
    public UserPhoto getPhoto(Long id) {
        find(id);
        return photoRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Este usuário não tem foto cadastrada."));
    }

    /** Envia ou substitui a foto do colaborador. */
    @Transactional
    public UserResponse savePhoto(Long id, MultipartFile file, User actor, String ip) {
        User user = find(id);
        PhotoUpload upload = PhotoUpload.from(file);

        photoRepository.findById(id).ifPresentOrElse(
                photo -> photo.replace(upload.contentType(), upload.data()),
                () -> photoRepository.save(new UserPhoto(id, upload.contentType(), upload.data())));

        auditService.record(actor.getId(), AuditAction.USUARIO_FOTO_ALTERADA, ENTITY, id,
                "matrícula=" + user.getRegistration() + "; " + upload.describe(), ip);
        return UserResponse.from(user, true);
    }

    @Transactional
    public UserResponse deletePhoto(Long id, User actor, String ip) {
        User user = find(id);
        if (photoRepository.existsById(id)) {
            photoRepository.deleteById(id);
            auditService.record(actor.getId(), AuditAction.USUARIO_FOTO_REMOVIDA, ENTITY, id,
                    "matrícula=" + user.getRegistration(), ip);
        }
        return UserResponse.from(user, false);
    }

    // ---- regras e validações ----

    private Map<String, String> validate(UserRequest request, Long id) {
        Map<String, String> errors = new LinkedHashMap<>();
        long currentId = id == null ? 0L : id;

        if (userRepository.existsByEmailIgnoreCaseAndIdNot(normalizeEmail(request.email()), currentId)) {
            errors.put("email", "Já existe um usuário com este e-mail.");
        }
        if (userRepository.existsByRegistrationIgnoreCaseAndIdNot(normalizeRegistration(request.registration()), currentId)) {
            errors.put("registration", "Já existe um usuário com esta matrícula.");
        }
        String password = request.password();
        if (password != null && !password.isBlank() && !PASSWORD_POLICY.matcher(password).matches()) {
            errors.put("password", PASSWORD_POLICY_MESSAGE);
        }
        return errors;
    }

    private Set<Base> resolveBases(List<String> codes, Map<String, String> errors) {
        Set<Base> bases = new LinkedHashSet<>();
        for (String code : codes) {
            baseRepository.findByCodeAndActiveTrue(code).ifPresentOrElse(bases::add,
                    () -> errors.put("baseCodes", "Base inválida ou inativa: " + code + "."));
        }
        return bases;
    }

    /** Impede que o sistema fique sem nenhum engenheiro/administrador ativo. */
    private void ensureAnotherActiveEngineer(User user) {
        if (user.isActive() && userRepository.countByRoleAndActiveTrue(Role.ENGENHEIRO) <= 1) {
            throw conflict("O sistema precisa de ao menos um Engenheiro / Administrador ativo.");
        }
    }

    private UserResponse response(User user) {
        return UserResponse.from(user, photoRepository.existsById(user.getId()));
    }

    private User find(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
    }

    private static void throwIfInvalid(Map<String, String> errors) {
        if (!errors.isEmpty()) {
            HttpStatus status = errors.containsKey("email") || errors.containsKey("registration")
                    ? HttpStatus.CONFLICT : HttpStatus.BAD_REQUEST;
            throw new ApiException(status, "Verifique os campos informados.", errors);
        }
    }

    private static ApiException conflict(String message) {
        return new ApiException(HttpStatus.CONFLICT, message);
    }

    private static void track(List<String> changes, String field, String before, String after) {
        if (before == null ? after != null : !before.equals(after)) {
            changes.add(field + ": " + (before == null ? "-" : before) + " -> " + (after == null ? "-" : after));
        }
    }

    private static String codes(Set<Base> bases) {
        return bases.stream().map(Base::getCode).sorted().collect(Collectors.joining(","));
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private static String normalizeRegistration(String registration) {
        return registration.trim().toUpperCase();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
