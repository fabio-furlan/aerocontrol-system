package br.com.aerocontrol.base.application;

import br.com.aerocontrol.base.application.BaseDtos.BaseResponse;
import br.com.aerocontrol.base.domain.Base;
import br.com.aerocontrol.base.domain.BaseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Ponto de acesso às bases para os demais módulos, que não usam o {@link BaseRepository} diretamente.
 */
@Service
public class BaseService {

    private final BaseRepository baseRepository;

    public BaseService(BaseRepository baseRepository) {
        this.baseRepository = baseRepository;
    }

    @Transactional(readOnly = true)
    public List<BaseResponse> listActive() {
        return baseRepository.findByActiveTrueOrderByCode().stream().map(BaseResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<Base> findAll() {
        return baseRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Base> findActiveByCode(String code) {
        return baseRepository.findByCodeAndActiveTrue(code);
    }
}
