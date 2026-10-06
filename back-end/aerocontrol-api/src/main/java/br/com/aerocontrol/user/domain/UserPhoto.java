package br.com.aerocontrol.user.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Foto do colaborador. Separada da entidade User para não carregar a imagem no login e na listagem.
 */
@Entity
@Table(name = "user_photos")
@Getter
@NoArgsConstructor
public class UserPhoto {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "content_type", nullable = false, length = 20)
    private String contentType;

    @Column(nullable = false)
    private byte[] data;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public UserPhoto(Long userId, String contentType, byte[] data) {
        this.userId = userId;
        replace(contentType, data);
    }

    public void replace(String contentType, byte[] data) {
        this.contentType = contentType;
        this.data = data;
        this.updatedAt = Instant.now();
    }
}
