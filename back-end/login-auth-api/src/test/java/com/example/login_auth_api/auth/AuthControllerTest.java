package com.example.login_auth_api.auth;

import com.example.login_auth_api.domain.audit.AuditLogRepository;
import com.example.login_auth_api.domain.user.User;
import com.example.login_auth_api.domain.user.UserRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class AuthControllerTest {

    private static final String PASSWORD = "Teste@123";

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    private ResultActions login(String base, String login, String password) throws Exception {
        String body = """
                {"baseCode": "%s", "login": "%s", "password": "%s"}
                """.formatted(base, login, password);
        return mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private String tokenOf(ResultActions result) throws Exception {
        return JsonPath.read(result.andReturn().getResponse().getContentAsString(), "$.token");
    }

    @Test
    void listaBasesSemAutenticacao() throws Exception {
        mvc.perform(get("/api/bases"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].code").value("SBCF"));
    }

    @Test
    void engenheiroEntraPelaMatriculaComTodasAsPermissoes() throws Exception {
        login("SBCF", "ENG001", PASSWORD)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.role").value("ENGENHEIRO"))
                .andExpect(jsonPath("$.user.roleLabel").value("Engenheiro / Administrador"))
                .andExpect(jsonPath("$.user.base.code").value("SBCF"))
                .andExpect(jsonPath("$.user.permissions[*].code").value(hasItem("USUARIO_GERENCIAR")))
                .andExpect(jsonPath("$.user.permissions[*].code").value(hasItem("AERONAVE_CADASTRAR")));

        assertThat(auditLogRepository.findByActionOrderByOccurredAtDesc("LOGIN")).isNotEmpty();
    }

    @Test
    void mecanicoEntraPeloEmailSemDiferenciarMaiusculas() throws Exception {
        login("SBGR", "MECANICO@FBAERO.DEV", PASSWORD)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("MECANICO"))
                .andExpect(jsonPath("$.user.permissions[*].code").value(hasItem("OS_ABRIR")))
                .andExpect(jsonPath("$.user.permissions[*].code").value(not(hasItem("AERONAVE_CADASTRAR"))));
    }

    @Test
    void pilotoSoPodeRegistrarHorasDeVoo() throws Exception {
        login("SBGR", "PIL001", PASSWORD)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.permissions[*].code").value(hasItem("HORAS_VOO_REGISTRAR")))
                .andExpect(jsonPath("$.user.permissions[*].code").value(not(hasItem("OS_ABRIR"))));
    }

    @Test
    void senhaErradaRetorna401EGravaAuditoria() throws Exception {
        login("SBGR", "ENG001", "senha-errada")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Usuário ou senha inválidos."));

        assertThat(auditLogRepository.findByActionOrderByOccurredAtDesc("LOGIN_FALHOU")).isNotEmpty();
    }

    @Test
    void usuarioInexistenteRecebeAMesmaMensagemDeSenhaErrada() throws Exception {
        login("SBGR", "NINGUEM", PASSWORD)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Usuário ou senha inválidos."));
    }

    @Test
    void baseNaoAutorizadaRetorna403() throws Exception {
        login("SBKP", "PIL001", PASSWORD)
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(
                        "Você não tem acesso à base SBKP. Selecione uma base autorizada."));
    }

    @Test
    void baseInexistenteRetorna400() throws Exception {
        login("XXXX", "ENG001", PASSWORD)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Base de operação inválida."));
    }

    @Test
    void camposVaziosRetornam400ComMensagemPorCampo() throws Exception {
        login("", "", "")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.baseCode").value("Selecione a base de operação."))
                .andExpect(jsonPath("$.fields.login").value("Informe sua matrícula ou e-mail."))
                .andExpect(jsonPath("$.fields.password").value("Informe sua senha."));
    }

    @Test
    void meRetornaUsuarioDoToken() throws Exception {
        String token = tokenOf(login("SBGR", "MEC001", PASSWORD));

        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.registration").value("MEC001"))
                .andExpect(jsonPath("$.base.code").value("SBGR"));
    }

    @Test
    void meSemTokenOuComTokenInvalidoRetorna401() throws Exception {
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer token-falso"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void usuarioInativoNaoEntraEPerdeASessao() throws Exception {
        String token = tokenOf(login("SBGR", "MEC001", PASSWORD));
        User mecanico = userRepository.findByLogin("MEC001").orElseThrow();
        mecanico.setActive(false);
        userRepository.save(mecanico);
        try {
            login("SBGR", "MEC001", PASSWORD)
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.message").value("Usuário inativo. Procure o administrador do sistema."));
            mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                    .andExpect(status().isUnauthorized());
        } finally {
            mecanico.setActive(true);
            userRepository.save(mecanico);
        }
    }
}
