package br.com.aerocontrol.user.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Set;

public interface UserPhotoRepository extends JpaRepository<UserPhoto, Long> {

    /** Ids dos usuários que têm foto, sem carregar as imagens. */
    @Query("select p.userId from UserPhoto p")
    Set<Long> findUserIdsWithPhoto();
}
