package br.com.aerocontrol.user.application;

import br.com.aerocontrol.user.domain.Role;
import br.com.aerocontrol.user.domain.User;
import org.springframework.data.jpa.domain.Specification;

/**
 * Filtros da listagem de usuários. Filtros vazios não restringem a busca.
 */
final class UserSpecifications {

    private UserSpecifications() {
    }

    static Specification<User> matches(String search, Role role, Boolean active) {
        return (root, query, cb) -> {
            var predicate = cb.conjunction();

            if (search != null && !search.isBlank()) {
                String like = "%" + search.trim().toLowerCase() + "%";
                predicate = cb.and(predicate, cb.or(
                        cb.like(cb.lower(root.get("name")), like),
                        cb.like(cb.lower(root.get("email")), like),
                        cb.like(cb.lower(root.get("registration")), like)));
            }
            if (role != null) {
                predicate = cb.and(predicate, cb.equal(root.get("role"), role));
            }
            if (active != null) {
                predicate = cb.and(predicate, cb.equal(root.get("active"), active));
            }
            return predicate;
        };
    }
}
