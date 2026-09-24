package com.example.login_auth_api.domain.audit;

import org.springframework.stereotype.Service;

@Service
public class AuditService {

    private final AuditLogRepository repository;

    public AuditService(AuditLogRepository repository) {
        this.repository = repository;
    }

    public void record(Long userId, AuditAction action, String entityType, Long entityId, String details, String ipAddress) {
        repository.save(new AuditLog(userId, action, entityType, entityId, details, ipAddress));
    }
}
