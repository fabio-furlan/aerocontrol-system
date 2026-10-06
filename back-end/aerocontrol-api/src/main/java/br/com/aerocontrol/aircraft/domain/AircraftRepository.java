package br.com.aerocontrol.aircraft.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AircraftRepository extends JpaRepository<Aircraft, Long>, JpaSpecificationExecutor<Aircraft> {

    boolean existsByRegistrationIgnoreCaseAndIdNot(String registration, Long id);
}
