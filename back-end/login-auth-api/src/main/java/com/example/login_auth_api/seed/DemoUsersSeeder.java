package com.example.login_auth_api.seed;

import com.example.login_auth_api.domain.base.Base;
import com.example.login_auth_api.domain.base.BaseRepository;
import com.example.login_auth_api.domain.user.Role;
import com.example.login_auth_api.domain.user.User;
import com.example.login_auth_api.domain.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Cria um usuário de demonstração para cada perfil, somente se o banco ainda não tiver usuários.
 * Ativado por app.seed.demo-users=true (padrão no perfil dev).
 */
@Component
@ConditionalOnProperty(name = "app.seed.demo-users", havingValue = "true")
public class DemoUsersSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoUsersSeeder.class);

    private final UserRepository userRepository;
    private final BaseRepository baseRepository;
    private final PasswordEncoder passwordEncoder;
    private final String demoPassword;

    public DemoUsersSeeder(UserRepository userRepository,
                           BaseRepository baseRepository,
                           PasswordEncoder passwordEncoder,
                           @Value("${app.seed.demo-password}") String demoPassword) {
        this.userRepository = userRepository;
        this.baseRepository = baseRepository;
        this.passwordEncoder = passwordEncoder;
        this.demoPassword = demoPassword;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.count() > 0) {
            return;
        }
        if (demoPassword == null || demoPassword.isBlank()) {
            throw new IllegalStateException("app.seed.demo-users=true exige DEMO_PASSWORD definida");
        }

        Map<String, Base> bases = baseRepository.findAll().stream()
                .collect(Collectors.toMap(Base::getCode, Function.identity()));
        String hash = passwordEncoder.encode(demoPassword);

        create("Ana Ribeiro", "engenheiro@fbaero.dev", "ENG001", hash, Role.ENGENHEIRO,
                List.copyOf(bases.values()));
        create("Carlos Souza", "mecanico@fbaero.dev", "MEC001", hash, Role.MECANICO,
                List.of(bases.get("SBGR"), bases.get("SBKP")));
        create("Rafael Lima", "piloto@fbaero.dev", "PIL001", hash, Role.PILOTO,
                List.of(bases.get("SBGR")));

        log.info("Usuários de demonstração criados: ENG001 (engenheiro), MEC001 (mecânico), PIL001 (piloto)");
    }

    private void create(String name, String email, String registration, String hash, Role role, List<Base> bases) {
        User user = new User(name, email, registration, hash, role);
        user.getBases().addAll(bases);
        userRepository.save(user);
    }
}
