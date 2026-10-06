package br.com.aerocontrol.base.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BaseRepository extends JpaRepository<Base, Long> {

    List<Base> findByActiveTrueOrderByCode();

    Optional<Base> findByCodeAndActiveTrue(String code);
}
