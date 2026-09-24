package com.example.login_auth_api.domain.audit;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

import java.time.Instant;

/**
 * Registro de auditoria. Imutável: só é inserido, nunca alterado ou removido.
 */
@Entity
@Immutable
@Table(name = "audit_log")
@Getter
@NoArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt = Instant.now();

    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false, length = 40)
    private String action;

    @Column(name = "entity_type", length = 40)
    private String entityType;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(length = 2000)
    private String details;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    public AuditLog(Long userId, AuditAction action, String entityType, Long entityId, String details, String ipAddress) {
        this.userId = userId;
        this.action = action.name();
        this.entityType = entityType;
        this.entityId = entityId;
        this.details = details;
        this.ipAddress = ipAddress;
    }
}
