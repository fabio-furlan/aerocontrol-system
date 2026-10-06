package br.com.aerocontrol.base.application;

import br.com.aerocontrol.base.domain.Base;

/**
 * Objetos de saída da API de bases.
 */
public final class BaseDtos {

    private BaseDtos() {
    }

    public record BaseResponse(String code, String name, String city, String state) {
        public static BaseResponse from(Base base) {
            return new BaseResponse(base.getCode(), base.getName(), base.getCity(), base.getState());
        }
    }
}
