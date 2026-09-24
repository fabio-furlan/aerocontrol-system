package com.example.login_auth_api.domain.audit;

public enum AuditAction {
    LOGIN,
    LOGIN_FALHOU,
    LOGIN_NEGADO_BASE,
    LOGIN_USUARIO_INATIVO,
    USUARIO_CRIADO,
    USUARIO_ALTERADO,
    USUARIO_ATIVADO,
    USUARIO_DESATIVADO,
    SENHA_REDEFINIDA
}
