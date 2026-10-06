package br.com.aerocontrol.aircraft.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Set;

public interface AircraftPhotoRepository extends JpaRepository<AircraftPhoto, Long> {

    /** Ids das aeronaves que têm foto, sem carregar as imagens. */
    @Query("select p.aircraftId from AircraftPhoto p")
    Set<Long> findAircraftIdsWithPhoto();
}
