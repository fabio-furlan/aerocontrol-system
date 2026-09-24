package com.example.login_auth_api.user;

import com.example.login_auth_api.domain.audit.AuditLogRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class UserControllerTest {

    private static final String PASSWORD = "Teste@123";

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private AuditLogRepository auditLogRepository;

    private MockMvc mvc;
    private String adminToken;

    @BeforeEach
    void setUp() throws Exception {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        adminToken = loginToken("SBGR", "ENG001", PASSWORD);
    }

    // ---- utilitários ----

    private ResultActions login(String base, String login, String password) throws Exception {
        return mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("""
                {"baseCode": "%s", "login": "%s", "password": "%s"}
                """.formatted(base, login, password)));
    }

    private String loginToken(String base, String login, String password) throws Exception {
        String body = login(base, login, password).andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.token");
    }

    private static String userJson(String name, String email, String registration, String role,
                                   String bases, String password) {
        return """
                {"name": "%s", "email": "%s", "registration": "%s", "role": "%s",
                 "licenseNumber": null, "baseCodes": [%s], "password": %s}
                """.formatted(name, email, registration, role, bases,
                password == null ? "null" : "\"" + password + "\"");
    }

    private ResultActions createUser(String json) throws Exception {
        return mvc.perform(post("/api/users").header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private long createdId(ResultActions result) throws Exception {
        return ((Number) JsonPath.read(result.andReturn().getResponse().getContentAsString(), "$.id")).longValue();
    }

    private ResultActions setActive(long id, boolean active) throws Exception {
        return mvc.perform(patch("/api/users/" + id + "/status").header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON).content("{\"active\": " + active + "}"));
    }

    // ---- acesso ----

    @Test
    void engenheiroListaUsuariosComFiltros() throws Exception {
        mvc.perform(get("/api/users").param("role", "PILOTO").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].registration").value(hasItem("PIL001")))
                .andExpect(jsonPath("$[*].registration").value(not(hasItem("ENG001"))));

        mvc.perform(get("/api/users").param("search", "carlos").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].registration").value("MEC001"))
                .andExpect(jsonPath("$[0].baseCodes[0]").value("SBGR"));
    }

    @Test
    void mecanicoEPilotoNaoAcessamOCadastro() throws Exception {
        String mechanicToken = loginToken("SBGR", "MEC001", PASSWORD);
        mvc.perform(get("/api/users").header("Authorization", "Bearer " + mechanicToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Seu perfil não tem permissão para esta ação."));

        String pilotToken = loginToken("SBGR", "PIL001", PASSWORD);
        mvc.perform(post("/api/users").header("Authorization", "Bearer " + pilotToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(userJson("X", "x@fbaero.dev", "X1", "PILOTO", "\"SBGR\"", "Senha1234")))
                .andExpect(status().isForbidden());
    }

    @Test
    void listaPerfisComAsPermissoesDeCadaUm() throws Exception {
        mvc.perform(get("/api/users/roles").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roles.length()").value(3))
                .andExpect(jsonPath("$.roles[?(@.code == 'PILOTO')].permissions[*]").value(hasItem("HORAS_VOO_REGISTRAR")))
                .andExpect(jsonPath("$.permissions[*].code").value(hasItem("USUARIO_GERENCIAR")));
    }

    // ---- cadastro ----

    @Test
    void criaUsuarioQueConsegueEntrarNaBaseAutorizada() throws Exception {
        createUser(userJson("Joana Prado", "Joana.Prado@FBAERO.dev", " tec010 ", "MECANICO", "\"SBKP\"", "Hangar2026"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("joana.prado@fbaero.dev"))
                .andExpect(jsonPath("$.registration").value("TEC010"))
                .andExpect(jsonPath("$.roleLabel").value("Mecânico / Técnico"))
                .andExpect(jsonPath("$.active").value(true));

        login("SBKP", "tec010", "Hangar2026")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("MECANICO"));
        login("SBGR", "TEC010", "Hangar2026").andExpect(status().isForbidden());

        assertThat(auditLogRepository.findByActionOrderByOccurredAtDesc("USUARIO_CRIADO")).isNotEmpty();
    }

    @Test
    void emailEMatriculaDuplicadosRetornam409PorCampo() throws Exception {
        createUser(userJson("Outro", "mecanico@fbaero.dev", "MEC001", "MECANICO", "\"SBGR\"", "Senha1234"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.fields.email").value("Já existe um usuário com este e-mail."))
                .andExpect(jsonPath("$.fields.registration").value("Já existe um usuário com esta matrícula."));
    }

    @Test
    void validaCamposObrigatoriosSenhaEBase() throws Exception {
        createUser(userJson("", "email-invalido", "", "PILOTO", "", null))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.name").value("Informe o nome."))
                .andExpect(jsonPath("$.fields.email").value("Informe um e-mail válido."))
                .andExpect(jsonPath("$.fields.baseCodes").value("Selecione ao menos uma base."));

        createUser(userJson("Sem Senha", "sem.senha@fbaero.dev", "SS01", "PILOTO", "\"SBGR\"", "fraca"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.password").value("A senha deve ter de 8 a 72 caracteres, com letras e números."));

        createUser(userJson("Base Ruim", "base.ruim@fbaero.dev", "BR01", "PILOTO", "\"ZZZZ\"", "Senha1234"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.baseCodes").value("Base inválida ou inativa: ZZZZ."));
    }

    // ---- edição ----

    @Test
    void editaPerfilBasesESenha() throws Exception {
        long id = createdId(createUser(userJson("Paulo Dias", "paulo.dias@fbaero.dev", "PIL020", "PILOTO",
                "\"SBGR\"", "Voo12345")));

        mvc.perform(put("/api/users/" + id).header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(userJson("Paulo Dias", "paulo.dias@fbaero.dev", "PIL020", "MECANICO",
                                "\"SBGR\", \"SBCF\"", "NovaSenha99")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("MECANICO"))
                .andExpect(jsonPath("$.baseCodes.length()").value(2));

        login("SBCF", "PIL020", "Voo12345").andExpect(status().isUnauthorized());
        login("SBCF", "PIL020", "NovaSenha99")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.permissions[*].code").value(hasItem("OS_ABRIR")));

        assertThat(auditLogRepository.findByActionOrderByOccurredAtDesc("USUARIO_ALTERADO")).isNotEmpty();
        assertThat(auditLogRepository.findByActionOrderByOccurredAtDesc("SENHA_REDEFINIDA")).isNotEmpty();
    }

    @Test
    void editarSemSenhaMantemASenhaAtual() throws Exception {
        long id = createdId(createUser(userJson("Lia Moura", "lia.moura@fbaero.dev", "MEC030", "MECANICO",
                "\"SBGR\"", "Chave2026")));

        mvc.perform(put("/api/users/" + id).header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(userJson("Lia Moura Alves", "lia.moura@fbaero.dev", "MEC030", "MECANICO",
                                "\"SBGR\"", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Lia Moura Alves"));

        login("SBGR", "MEC030", "Chave2026").andExpect(status().isOk());
    }

    @Test
    void engenheiroNaoPodeRebaixarNemDesativarASiMesmo() throws Exception {
        String me = mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + adminToken))
                .andReturn().getResponse().getContentAsString();
        long myId = ((Number) JsonPath.read(me, "$.id")).longValue();

        mvc.perform(put("/api/users/" + myId).header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(userJson("Ana Ribeiro", "engenheiro@fbaero.dev", "ENG001", "MECANICO",
                                "\"SBGR\"", null)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Você não pode alterar o seu próprio perfil de acesso."));

        setActive(myId, false)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Você não pode desativar o seu próprio usuário."));
    }

    // ---- ativação ----

    @Test
    void usuarioDesativadoNaoEntraEReativadoVoltaAEntrar() throws Exception {
        long id = createdId(createUser(userJson("Rita Alves", "rita.alves@fbaero.dev", "PIL040", "PILOTO",
                "\"SBGR\"", "Pista2026")));

        setActive(id, false).andExpect(status().isOk()).andExpect(jsonPath("$.active").value(false));
        login("SBGR", "PIL040", "Pista2026").andExpect(status().isForbidden());

        setActive(id, true).andExpect(status().isOk()).andExpect(jsonPath("$.active").value(true));
        login("SBGR", "PIL040", "Pista2026").andExpect(status().isOk());

        assertThat(auditLogRepository.findByActionOrderByOccurredAtDesc("USUARIO_DESATIVADO")).isNotEmpty();
    }

    @Test
    void usuarioInexistenteRetorna404() throws Exception {
        mvc.perform(get("/api/users/999999").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Usuário não encontrado."));
    }
}
