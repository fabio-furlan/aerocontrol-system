package br.com.aerocontrol.shared.exception;

import org.springframework.http.HttpStatus;

import java.util.Map;

/**
 * Erro de negócio com mensagem pronta para exibir ao usuário.
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final Map<String, String> fields;

    public ApiException(HttpStatus status, String message) {
        this(status, message, null);
    }

    /** Erro com mensagens por campo, exibidas ao lado de cada campo do formulário. */
    public ApiException(HttpStatus status, String message, Map<String, String> fields) {
        super(message);
        this.status = status;
        this.fields = fields;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public Map<String, String> getFields() {
        return fields;
    }
}
