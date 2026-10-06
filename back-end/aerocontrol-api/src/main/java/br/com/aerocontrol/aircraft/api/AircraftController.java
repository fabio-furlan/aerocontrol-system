package br.com.aerocontrol.aircraft.api;

import br.com.aerocontrol.aircraft.application.AircraftDtos.AircraftRequest;
import br.com.aerocontrol.aircraft.application.AircraftDtos.AircraftResponse;
import br.com.aerocontrol.aircraft.application.AircraftDtos.StatusResponse;
import br.com.aerocontrol.aircraft.application.AircraftService;
import br.com.aerocontrol.aircraft.domain.AircraftPhoto;
import br.com.aerocontrol.aircraft.domain.AircraftStatus;
import br.com.aerocontrol.security.AuthenticatedSession;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Cadastro de aeronaves. A consulta exige AERONAVE_VISUALIZAR (todos os perfis);
 * cadastrar, editar e trocar a foto exigem AERONAVE_CADASTRAR (somente Engenheiro / Administrador).
 */
@RestController
@RequestMapping("/api/aircraft")
@PreAuthorize("hasAuthority('AERONAVE_VISUALIZAR')")
public class AircraftController {

    private final AircraftService aircraftService;

    public AircraftController(AircraftService aircraftService) {
        this.aircraftService = aircraftService;
    }

    @GetMapping
    public List<AircraftResponse> list(@RequestParam(required = false) String search,
                                       @RequestParam(required = false) String baseCode,
                                       @RequestParam(required = false) AircraftStatus status) {
        return aircraftService.list(search, baseCode, status);
    }

    /** Status possíveis da aeronave, para filtros e formulário. */
    @GetMapping("/statuses")
    public List<StatusResponse> statuses() {
        return StatusResponse.all();
    }

    @GetMapping("/{id}")
    public AircraftResponse get(@PathVariable Long id) {
        return aircraftService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('AERONAVE_CADASTRAR')")
    public AircraftResponse create(@RequestBody @Valid AircraftRequest request,
                                   @AuthenticationPrincipal AuthenticatedSession session,
                                   HttpServletRequest http) {
        return aircraftService.create(request, session.user(), http.getRemoteAddr());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('AERONAVE_CADASTRAR')")
    public AircraftResponse update(@PathVariable Long id,
                                   @RequestBody @Valid AircraftRequest request,
                                   @AuthenticationPrincipal AuthenticatedSession session,
                                   HttpServletRequest http) {
        return aircraftService.update(id, request, session.user(), http.getRemoteAddr());
    }

    // ---- foto ----

    @GetMapping("/{id}/photo")
    public ResponseEntity<byte[]> photo(@PathVariable Long id) {
        AircraftPhoto photo = aircraftService.getPhoto(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(photo.getContentType()))
                .cacheControl(CacheControl.noCache().cachePrivate())
                .body(photo.getData());
    }

    @PutMapping(value = "/{id}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('AERONAVE_CADASTRAR')")
    public AircraftResponse uploadPhoto(@PathVariable Long id,
                                        @RequestParam(value = "file", required = false) MultipartFile file,
                                        @AuthenticationPrincipal AuthenticatedSession session,
                                        HttpServletRequest http) {
        return aircraftService.savePhoto(id, file, session.user(), http.getRemoteAddr());
    }

    @DeleteMapping("/{id}/photo")
    @PreAuthorize("hasAuthority('AERONAVE_CADASTRAR')")
    public AircraftResponse deletePhoto(@PathVariable Long id,
                                        @AuthenticationPrincipal AuthenticatedSession session,
                                        HttpServletRequest http) {
        return aircraftService.deletePhoto(id, session.user(), http.getRemoteAddr());
    }
}
