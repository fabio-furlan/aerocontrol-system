package br.com.aerocontrol.user.domain;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;

import static br.com.aerocontrol.user.domain.Permission.*;

/**
 * Perfis de acesso e as permissões de cada um.
 */
public enum Role {

    /** Cadastra aeronaves, define limites de TBO, aprova auditorias e administra usuários. */
    ENGENHEIRO("Engenheiro / Administrador", EnumSet.allOf(Permission.class)),

    /** Abre Ordens de Serviço, registra trocas de peças e atualiza o status de manutenção. */
    MECANICO("Mecânico / Técnico", EnumSet.of(
            AERONAVE_VISUALIZAR, DASHBOARD_VISUALIZAR,
            OS_ABRIR, OS_ATUALIZAR_STATUS, PECA_REGISTRAR_TROCA)),

    /** Apenas registra as horas de voo da aeronave. */
    PILOTO("Piloto / Operador", EnumSet.of(
            AERONAVE_VISUALIZAR, HORAS_VOO_REGISTRAR));

    private final String label;
    private final Set<Permission> permissions;

    Role(String label, Set<Permission> permissions) {
        this.label = label;
        this.permissions = Collections.unmodifiableSet(permissions);
    }

    public String getLabel() {
        return label;
    }

    public Set<Permission> getPermissions() {
        return permissions;
    }
}
