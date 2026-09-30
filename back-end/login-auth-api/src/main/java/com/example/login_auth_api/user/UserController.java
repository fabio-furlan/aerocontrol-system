package com.example.login_auth_api.user;

import com.example.login_auth_api.domain.user.Role;
import com.example.login_auth_api.domain.user.UserPhoto;
import com.example.login_auth_api.security.AuthenticatedSession;
import com.example.login_auth_api.user.UserDtos.RolesResponse;
import com.example.login_auth_api.user.UserDtos.StatusRequest;
import com.example.login_auth_api.user.UserDtos.UserRequest;
import com.example.login_auth_api.user.UserDtos.UserResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Cadastro de usuários. Restrito a quem tem a permissão USUARIO_GERENCIAR.
 * Usuários não são excluídos, apenas desativados, para preservar o histórico de auditoria.
 */
@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasAuthority('USUARIO_GERENCIAR')")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<UserResponse> list(@RequestParam(required = false) String search,
                                   @RequestParam(required = false) Role role,
                                   @RequestParam(required = false) Boolean active) {
        return userService.list(search, role, active);
    }

    /** Perfis de acesso e as permissões de cada um (matriz exibida no formulário). */
    @GetMapping("/roles")
    public RolesResponse roles() {
        return RolesResponse.all();
    }

    @GetMapping("/{id}")
    public UserResponse get(@PathVariable Long id) {
        return userService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse create(@RequestBody @Valid UserRequest request,
                               @AuthenticationPrincipal AuthenticatedSession session,
                               HttpServletRequest http) {
        return userService.create(request, session.user(), http.getRemoteAddr());
    }

    @PutMapping("/{id}")
    public UserResponse update(@PathVariable Long id,
                               @RequestBody @Valid UserRequest request,
                               @AuthenticationPrincipal AuthenticatedSession session,
                               HttpServletRequest http) {
        return userService.update(id, request, session.user(), http.getRemoteAddr());
    }

    @PatchMapping("/{id}/status")
    public UserResponse changeStatus(@PathVariable Long id,
                                     @RequestBody @Valid StatusRequest request,
                                     @AuthenticationPrincipal AuthenticatedSession session,
                                     HttpServletRequest http) {
        return userService.changeStatus(id, request.active(), session.user(), http.getRemoteAddr());
    }

    // ---- foto do colaborador ----

    @GetMapping("/{id}/photo")
    public ResponseEntity<byte[]> photo(@PathVariable Long id) {
        UserPhoto photo = userService.getPhoto(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(photo.getContentType()))
                .cacheControl(CacheControl.noCache().cachePrivate())
                .body(photo.getData());
    }

    @PutMapping(value = "/{id}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserResponse uploadPhoto(@PathVariable Long id,
                                    @RequestParam(value = "file", required = false) MultipartFile file,
                                    @AuthenticationPrincipal AuthenticatedSession session,
                                    HttpServletRequest http) {
        return userService.savePhoto(id, file, session.user(), http.getRemoteAddr());
    }

    @DeleteMapping("/{id}/photo")
    public UserResponse deletePhoto(@PathVariable Long id,
                                    @AuthenticationPrincipal AuthenticatedSession session,
                                    HttpServletRequest http) {
        return userService.deletePhoto(id, session.user(), http.getRemoteAddr());
    }
}
