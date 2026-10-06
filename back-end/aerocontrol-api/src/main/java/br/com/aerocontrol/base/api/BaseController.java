package br.com.aerocontrol.base.api;

import br.com.aerocontrol.base.application.BaseDtos.BaseResponse;
import br.com.aerocontrol.base.application.BaseService;
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

    private final BaseService baseService;

    public BaseController(BaseService baseService) {
        this.baseService = baseService;
    }

    @GetMapping
    public List<BaseResponse> list() {
        return baseService.listActive();
    }
}
