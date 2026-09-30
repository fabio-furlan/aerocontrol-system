package com.example.login_auth_api.photo;

import com.example.login_auth_api.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Foto enviada e já validada (aeronaves e colaboradores): JPEG, PNG ou WEBP de até 5 MB.
 * O tipo é conferido pelo conteúdo do arquivo, não pelo nome nem pelo tipo informado pelo navegador.
 */
public record PhotoUpload(String contentType, byte[] data) {

    public static final long MAX_BYTES = 5L * 1024 * 1024;

    public static PhotoUpload from(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Selecione uma foto para enviar.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "A foto deve ter até 5 MB.");
        }
        byte[] data;
        try {
            data = file.getBytes();
        } catch (IOException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Não foi possível ler o arquivo enviado.");
        }
        String contentType = detectImageType(data);
        if (contentType == null) {
            throw new ApiException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Formato não suportado. Envie uma foto JPG, PNG ou WEBP.");
        }
        return new PhotoUpload(contentType, data);
    }

    /** Identifica JPEG, PNG ou WEBP pelos primeiros bytes; qualquer outro conteúdo é recusado. */
    static String detectImageType(byte[] data) {
        if (startsWith(data, 0, 0xFF, 0xD8, 0xFF)) {
            return "image/jpeg";
        }
        if (startsWith(data, 0, 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A)) {
            return "image/png";
        }
        if (startsWith(data, 0, 'R', 'I', 'F', 'F') && startsWith(data, 8, 'W', 'E', 'B', 'P')) {
            return "image/webp";
        }
        return null;
    }

    private static boolean startsWith(byte[] data, int offset, int... signature) {
        if (data.length < offset + signature.length) {
            return false;
        }
        for (int i = 0; i < signature.length; i++) {
            if ((data[offset + i] & 0xFF) != signature[i]) {
                return false;
            }
        }
        return true;
    }

    /** Detalhe para o log de auditoria. */
    public String describe() {
        return "tipo=" + contentType + "; bytes=" + data.length;
    }
}
