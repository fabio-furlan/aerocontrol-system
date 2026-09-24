package com.example.login_auth_api.domain.audit;

import org.springframework.data.repository.Repository;

import java.util.List;

/**
 * Repositório somente de inserção e leitura: não expõe update nem delete.
 */
public interface AuditLogRepository extends Repository<AuditLog, Long> {

    AuditLog save(AuditLog log);

    List<AuditLog> findByActionOrderByOccurredAtDesc(String action);
}
