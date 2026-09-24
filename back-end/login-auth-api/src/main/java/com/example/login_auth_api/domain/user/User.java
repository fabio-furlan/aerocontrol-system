package com.example.login_auth_api.domain.user;

import com.example.login_auth_api.domain.base.Base;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, unique = true, length = 160)
    private String email;

    /** Matrícula do colaborador. */
    @Column(nullable = false, unique = true, length = 20)
    private String registration;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private Role role;

    /** CANAC / licença ANAC, quando houver. */
    @Column(name = "license_number", length = 30)
    private String licenseNumber;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    /** Bases em que o usuário pode atuar. */
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_bases",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "base_id"))
    private Set<Base> bases = new HashSet<>();

    public User(String name, String email, String registration, String passwordHash, Role role) {
        this.name = name;
        this.email = email;
        this.registration = registration;
        this.passwordHash = passwordHash;
        this.role = role;
    }

    public boolean canAccess(Base base) {
        return bases.stream().anyMatch(b -> b.getId().equals(base.getId()));
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    // ---- Spring Security ----

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + role.name()));
        role.getPermissions().forEach(p -> authorities.add(new SimpleGrantedAuthority(p.name())));
        return authorities;
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    // isEnabled() fica com o padrão (true): a conta inativa é verificada no AuthService só
    // depois de a senha ser validada, para não revelar quais usuários existem.
}
