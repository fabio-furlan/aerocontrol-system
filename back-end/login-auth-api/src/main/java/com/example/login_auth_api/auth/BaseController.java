package com.example.login_auth_api.auth;

import com.example.login_auth_api.auth.AuthDtos.BaseResponse;
import com.example.login_auth_api.domain.base.BaseRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Lista pública das bases ativas, usada no seletor da tela de login.
 */
@RestController
@RequestMapping("/api/bases")
public class BaseController {

    private final BaseRepository baseRepository;

    public BaseController(BaseRepository baseRepository) {
        this.baseRepository = baseRepository;
    }

    @GetMapping
    public List<BaseResponse> list() {
        return baseRepository.findByActiveTrueOrderByCode().stream().map(BaseResponse::from).toList();
    }
}
