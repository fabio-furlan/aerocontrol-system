package com.example.login_auth_api.aircraft;

import com.example.login_auth_api.domain.aircraft.Aircraft;
import com.example.login_auth_api.domain.aircraft.AircraftStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;

/**
 * Objetos de entrada e saída do cadastro de aeronaves.
 */
public final class AircraftDtos {

    private AircraftDtos() {
    }

    /**
     * Dados para cadastrar ou editar uma aeronave. Horas e ciclos informados no cadastro
     * são os acumulados até hoje (aeronave que já chega com histórico).
     */
    public record AircraftRequest(
            @NotBlank(message = "Informe a matrícula.")
            @Size(max = 10, message = "A matrícula deve ter até 10 caracteres.")
            String registration,

            @NotBlank(message = "Informe o fabricante.")
            @Size(max = 60, message = "O fabricante deve ter até 60 caracteres.")
            String manufacturer,

            @NotBlank(message = "Informe o modelo.")
            @Size(max = 60, message = "O modelo deve ter até 60 caracteres.")
            String model,

            @NotBlank(message = "Informe o número de série.")
            @Size(max = 40, message = "O número de série deve ter até 40 caracteres.")
            String serialNumber,

            @NotBlank(message = "Selecione a base.")
            String baseCode,

            @NotNull(message = "Selecione o status.")
            AircraftStatus status,

            @NotNull(message = "Informe as horas totais de voo.")
            @DecimalMin(value = "0.0", message = "As horas não podem ser negativas.")
            @Digits(integer = 9, fraction = 1, message = "Informe as horas com no máximo uma casa decimal.")
            BigDecimal totalFlightHours,

            @NotNull(message = "Informe os ciclos totais.")
            @Min(value = 0, message = "Os ciclos não podem ser negativos.")
            Integer totalCycles) {
    }

    public record AircraftResponse(
            Long id,
            String registration,
            String manufacturer,
            String model,
            String serialNumber,
            String baseCode,
            String baseName,
            BigDecimal totalFlightHours,
            int totalCycles,
            String status,
            String statusLabel,
            boolean hasPhoto,
            Instant createdAt,
            Instant updatedAt) {

        public static AircraftResponse from(Aircraft aircraft, boolean hasPhoto) {
            return new AircraftResponse(
                    aircraft.getId(),
                    aircraft.getRegistration(),
                    aircraft.getManufacturer(),
                    aircraft.getModel(),
                    aircraft.getSerialNumber(),
                    aircraft.getBase().getCode(),
                    aircraft.getBase().getName(),
                    aircraft.getTotalFlightHours(),
                    aircraft.getTotalCycles(),
                    aircraft.getStatus().name(),
                    aircraft.getStatus().getLabel(),
                    hasPhoto,
                    aircraft.getCreatedAt(),
                    aircraft.getUpdatedAt());
        }
    }

    public record StatusResponse(String code, String label) {

        static List<StatusResponse> all() {
            return Arrays.stream(AircraftStatus.values())
                    .map(s -> new StatusResponse(s.name(), s.getLabel()))
                    .toList();
        }
    }
}
