package com.example.login_auth_api.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    /** Busca pelo e-mail (sem diferenciar maiúsculas) ou pela matrícula. */
    @Query("select u from User u where lower(u.email) = lower(:login) or u.registration = :login")
    Optional<User> findByLogin(@Param("login") String login);
}
