package com.example.login_auth_api.aircraft;

import com.example.login_auth_api.domain.audit.AuditLogRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class AircraftControllerTest {

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
        adminToken = loginToken("SBGR", "ENG001");
    }

    // ---- utilitários ----

    private String loginToken(String base, String login) throws Exception {
        String body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("""
                        {"baseCode": "%s", "login": "%s", "password": "%s"}
                        """.formatted(base, login, PASSWORD)))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.token");
    }

    private static String aircraftJson(String registration, String base, String status, String hours, int cycles) {
        return """
                {"registration": "%s", "manufacturer": "Embraer", "model": "E195-E2",
                 "serialNumber": "SN-%s", "baseCode": "%s", "status": "%s",
                 "totalFlightHours": %s, "totalCycles": %d}
                """.formatted(registration, registration.trim(), base, status, hours, cycles);
    }

    private ResultActions create(String token, String json) throws Exception {
        return mvc.perform(post("/api/aircraft").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private long createdId(ResultActions result) throws Exception {
        return ((Number) JsonPath.read(result.andReturn().getResponse().getContentAsString(), "$.id")).longValue();
    }

    // ---- cadastro ----

    @Test
    void engenheiroCadastraAeronaveComMatriculaNormalizada() throws Exception {
        create(adminToken, aircraftJson(" pr-aaa ", "SBKP", "OPERACIONAL", "1520.5", 830))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.registration").value("PR-AAA"))
                .andExpect(jsonPath("$.baseCode").value("SBKP"))
                .andExpect(jsonPath("$.totalFlightHours").value(1520.5))
                .andExpect(jsonPath("$.totalCycles").value(830))
                .andExpect(jsonPath("$.statusLabel").value("Operacional"));

        assertThat(auditLogRepository.findByActionOrderByOccurredAtDesc("AERONAVE_CRIADA")).isNotEmpty();
    }

    @Test
    void matriculaDuplicadaRetorna409() throws Exception {
        create(adminToken, aircraftJson("PR-AAB", "SBGR", "OPERACIONAL", "0", 0)).andExpect(status().isCreated());

        create(adminToken, aircraftJson("pr-aab", "SBGR", "OPERACIONAL", "0", 0))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.fields.registration").value("Já existe uma aeronave com esta matrícula."));
    }

    @Test
    void validaCamposMatriculaEBase() throws Exception {
        create(adminToken, """
                {"registration": "", "manufacturer": "", "model": "", "serialNumber": "",
                 "baseCode": "SBGR", "status": "OPERACIONAL", "totalFlightHours": -1, "totalCycles": -1}
                """)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.registration").value("Informe a matrícula."))
                .andExpect(jsonPath("$.fields.model").value("Informe o modelo."))
                .andExpect(jsonPath("$.fields.totalFlightHours").value("As horas não podem ser negativas."))
                .andExpect(jsonPath("$.fields.totalCycles").value("Os ciclos não podem ser negativos."));

        create(adminToken, aircraftJson("PR AAC!", "XXXX", "OPERACIONAL", "0", 0))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.registration").exists())
                .andExpect(jsonPath("$.fields.baseCode").value("Base inválida ou inativa: XXXX."));
    }

    @Test
    void editaAeronaveERegistraAuditoria() throws Exception {
        long id = createdId(create(adminToken, aircraftJson("PR-AAD", "SBGR", "OPERACIONAL", "100", 50)));

        mvc.perform(put("/api/aircraft/" + id).header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(aircraftJson("PR-AAD", "SBCF", "EM_MANUTENCAO", "100.0", 50)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.baseCode").value("SBCF"))
                .andExpect(jsonPath("$.status").value("EM_MANUTENCAO"));

        assertThat(auditLogRepository.findByActionOrderByOccurredAtDesc("AERONAVE_ALTERADA"))
                .anySatisfy(log -> {
                    assertThat(log.getEntityId()).isEqualTo(id);
                    assertThat(log.getDetails()).isEqualTo("base: SBGR -> SBCF; status: OPERACIONAL -> EM_MANUTENCAO");
                });
    }

    // ---- foto ----

    /** Menor conteúdo aceito como PNG: a assinatura do formato seguida de alguns bytes. */
    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 13};

    private ResultActions uploadPhoto(String token, long id, String filename, byte[] data) throws Exception {
        return mvc.perform(multipart(HttpMethod.PUT, "/api/aircraft/" + id + "/photo")
                .file(new MockMultipartFile("file", filename, "application/octet-stream", data))
                .header("Authorization", "Bearer " + token));
    }

    @Test
    void engenheiroEnviaTrocaERemoveAFoto() throws Exception {
        long id = createdId(create(adminToken, aircraftJson("PR-AAG", "SBGR", "OPERACIONAL", "0", 0)
        ).andExpect(jsonPath("$.hasPhoto").value(false)));

        uploadPhoto(adminToken, id, "foto.png", PNG)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasPhoto").value(true));

        String mechanicToken = loginToken("SBGR", "MEC001");
        mvc.perform(get("/api/aircraft/" + id + "/photo").header("Authorization", "Bearer " + mechanicToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/png"))
                .andExpect(content().bytes(PNG));
        mvc.perform(get("/api/aircraft").param("search", "PR-AAG").header("Authorization", "Bearer " + mechanicToken))
                .andExpect(jsonPath("$[0].hasPhoto").value(true));

        mvc.perform(delete("/api/aircraft/" + id + "/photo").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasPhoto").value(false));
        mvc.perform(get("/api/aircraft/" + id + "/photo").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());

        assertThat(auditLogRepository.findByActionOrderByOccurredAtDesc("AERONAVE_FOTO_ALTERADA")).isNotEmpty();
        assertThat(auditLogRepository.findByActionOrderByOccurredAtDesc("AERONAVE_FOTO_REMOVIDA")).isNotEmpty();
    }

    @Test
    void recusaArquivoQueNaoEImagem() throws Exception {
        long id = createdId(create(adminToken, aircraftJson("PR-AAH", "SBGR", "OPERACIONAL", "0", 0)));

        // Nome de imagem, mas o conteúdo é texto: o tipo é conferido pelos bytes
        uploadPhoto(adminToken, id, "foto.jpg", "nao sou imagem".getBytes())
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.message").value("Formato não suportado. Envie uma foto JPG, PNG ou WEBP."));
    }

    @Test
    void mecanicoNaoTrocaAFoto() throws Exception {
        long id = createdId(create(adminToken, aircraftJson("PR-AAI", "SBGR", "OPERACIONAL", "0", 0)));

        uploadPhoto(loginToken("SBGR", "MEC001"), id, "foto.png", PNG).andExpect(status().isForbidden());
        mvc.perform(delete("/api/aircraft/" + id + "/photo")
                        .header("Authorization", "Bearer " + loginToken("SBGR", "PIL001")))
                .andExpect(status().isForbidden());
    }

    // ---- acesso ----

    @Test
    void mecanicoEPilotoConsultamMasNaoCadastram() throws Exception {
        create(adminToken, aircraftJson("PR-AAE", "SBGR", "AOG", "0", 0)).andExpect(status().isCreated());

        String mechanicToken = loginToken("SBGR", "MEC001");
        mvc.perform(get("/api/aircraft").param("status", "AOG").header("Authorization", "Bearer " + mechanicToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].registration").value(hasItem("PR-AAE")));
        create(mechanicToken, aircraftJson("PR-AAF", "SBGR", "OPERACIONAL", "0", 0))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Seu perfil não tem permissão para esta ação."));

        String pilotToken = loginToken("SBGR", "PIL001");
        mvc.perform(get("/api/aircraft").header("Authorization", "Bearer " + pilotToken))
                .andExpect(status().isOk());
        create(pilotToken, aircraftJson("PR-AAF", "SBGR", "OPERACIONAL", "0", 0))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/aircraft").header("Authorization", "Bearer " + adminToken))
                .andExpect(jsonPath("$[*].registration").value(not(hasItem("PR-AAF"))));
    }

    @Test
    void semTokenRetorna401() throws Exception {
        mvc.perform(get("/api/aircraft")).andExpect(status().isUnauthorized());
    }

    @Test
    void listaStatusDisponiveis() throws Exception {
        mvc.perform(get("/api/aircraft/statuses").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(4))
                .andExpect(jsonPath("$[?(@.code == 'AOG')].label").value(hasItem("AOG - Parada")));
    }
}
