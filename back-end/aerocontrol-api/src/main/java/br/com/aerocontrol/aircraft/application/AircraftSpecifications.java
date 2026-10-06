package br.com.aerocontrol.aircraft.application;

import br.com.aerocontrol.aircraft.domain.Aircraft;
import br.com.aerocontrol.aircraft.domain.AircraftStatus;
import org.springframework.data.jpa.domain.Specification;

/**
 * Filtros da listagem de aeronaves. Filtros vazios não restringem a busca.
 */
final class AircraftSpecifications {

    private AircraftSpecifications() {
    }

    static Specification<Aircraft> matches(String search, String baseCode, AircraftStatus status) {
        return (root, query, cb) -> {
            var predicate = cb.conjunction();

            if (search != null && !search.isBlank()) {
                String like = "%" + search.trim().toLowerCase() + "%";
                predicate = cb.and(predicate, cb.or(
                        cb.like(cb.lower(root.get("registration")), like),
                        cb.like(cb.lower(root.get("model")), like),
                        cb.like(cb.lower(root.get("manufacturer")), like),
                        cb.like(cb.lower(root.get("serialNumber")), like)));
            }
            if (baseCode != null && !baseCode.isBlank()) {
                predicate = cb.and(predicate, cb.equal(root.get("base").get("code"), baseCode.trim().toUpperCase()));
            }
            if (status != null) {
                predicate = cb.and(predicate, cb.equal(root.get("status"), status));
            }
            return predicate;
        };
    }
}
