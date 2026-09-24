package com.example.login_auth_api.domain.user;

/**
 * Permissões de acesso do sistema. Cada perfil ({@link Role}) recebe um conjunto delas.
 */
public enum Permission {

    USUARIO_GERENCIAR("Cadastrar usuários e permissões de acesso"),
    AERONAVE_CADASTRAR("Cadastrar aeronaves"),
    AERONAVE_VISUALIZAR("Consultar aeronaves e componentes"),
    COMPONENTE_DEFINIR_TBO("Cadastrar componentes e definir limites de TBO"),
    DASHBOARD_VISUALIZAR("Visualizar o painel de saúde das peças"),
    AUDITORIA_APROVAR("Aprovar auditorias e serviços pesados"),
    OS_ABRIR("Abrir ordens de serviço"),
    OS_ATUALIZAR_STATUS("Atualizar o status de manutenção"),
    PECA_REGISTRAR_TROCA("Registrar trocas de peças"),
    HORAS_VOO_REGISTRAR("Registrar horas de voo");

    private final String description;

    Permission(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
