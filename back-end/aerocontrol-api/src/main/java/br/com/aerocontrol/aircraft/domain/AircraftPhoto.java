package br.com.aerocontrol.aircraft.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Foto da aeronave. Separada da entidade Aircraft para não carregar a imagem na listagem.
 */
@Entity
@Table(name = "aircraft_photos")
@Getter
@NoArgsConstructor
public class AircraftPhoto {

    @Id
    @Column(name = "aircraft_id")
    private Long aircraftId;

    @Column(name = "content_type", nullable = false, length = 20)
    private String contentType;

    @Column(nullable = false)
    private byte[] data;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public AircraftPhoto(Long aircraftId, String contentType, byte[] data) {
        this.aircraftId = aircraftId;
        replace(contentType, data);
    }

    public void replace(String contentType, byte[] data) {
        this.contentType = contentType;
        this.data = data;
        this.updatedAt = Instant.now();
    }
}
