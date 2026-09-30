package com.example.login_auth_api.domain.aircraft;

/**
 * Situação operacional da aeronave.
 */
public enum AircraftStatus {

    OPERACIONAL("Operacional"),
    EM_MANUTENCAO("Em manutenção"),
    /** Aircraft On Ground: parada aguardando peça ou reparo, impedida de voar. */
    AOG("AOG - Parada"),
    INATIVA("Inativa");

    private final String label;

    AircraftStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
