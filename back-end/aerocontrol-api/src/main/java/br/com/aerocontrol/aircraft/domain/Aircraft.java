package br.com.aerocontrol.aircraft.domain;

import br.com.aerocontrol.base.domain.Base;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Aeronave controlada pelo MRO, identificada pela matrícula (ex.: PR-FBA).
 */
@Entity
@Table(name = "aircraft")
@Getter
@Setter
@NoArgsConstructor
public class Aircraft {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Matrícula (prefixo) da aeronave. */
    @Column(nullable = false, unique = true, length = 10)
    private String registration;

    @Column(nullable = false, length = 60)
    private String model;

    @Column(nullable = false, length = 60)
    private String manufacturer;

    @Column(name = "serial_number", nullable = false, length = 40)
    private String serialNumber;

    /** Base de manutenção onde a aeronave está alocada. */
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "base_id", nullable = false)
    private Base base;

    /** Horas totais de voo (TSN). Atualizadas pelos registros de voo. */
    @Column(name = "total_flight_hours", nullable = false, precision = 10, scale = 1)
    private BigDecimal totalFlightHours = BigDecimal.ZERO;

    /** Ciclos totais (pousos). */
    @Column(name = "total_cycles", nullable = false)
    private int totalCycles;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private AircraftStatus status = AircraftStatus.OPERACIONAL;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Aircraft(String registration, String model, String manufacturer, String serialNumber, Base base) {
        this.registration = registration;
        this.model = model;
        this.manufacturer = manufacturer;
        this.serialNumber = serialNumber;
        this.base = base;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
