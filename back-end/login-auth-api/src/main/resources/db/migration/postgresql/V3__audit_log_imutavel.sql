-- Garante no próprio banco que o log de auditoria é imutável:
-- qualquer UPDATE ou DELETE em audit_log é rejeitado.
CREATE OR REPLACE FUNCTION audit_log_block_changes() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'audit_log é imutável: % não permitido', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_log_immutable
    BEFORE UPDATE OR DELETE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION audit_log_block_changes();
