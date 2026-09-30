package com.example.login_auth_api.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    /** Busca pelo e-mail ou pela matrícula, sem diferenciar maiúsculas. */
    @Query("select u from User u where lower(u.email) = lower(:login) or upper(u.registration) = upper(:login)")
    Optional<User> findByLogin(@Param("login") String login);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

    boolean existsByRegistrationIgnoreCaseAndIdNot(String registration, Long id);

    long countByRoleAndActiveTrue(Role role);
}
