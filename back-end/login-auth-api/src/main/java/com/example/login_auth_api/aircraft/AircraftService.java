package com.example.login_auth_api.aircraft;

import com.example.login_auth_api.aircraft.AircraftDtos.AircraftRequest;
import com.example.login_auth_api.aircraft.AircraftDtos.AircraftResponse;
import com.example.login_auth_api.domain.aircraft.Aircraft;
import com.example.login_auth_api.domain.aircraft.AircraftPhoto;
import com.example.login_auth_api.domain.aircraft.AircraftPhotoRepository;
import com.example.login_auth_api.domain.aircraft.AircraftRepository;
import com.example.login_auth_api.domain.aircraft.AircraftStatus;
import com.example.login_auth_api.domain.audit.AuditAction;
import com.example.login_auth_api.domain.audit.AuditService;
import com.example.login_auth_api.domain.base.Base;
import com.example.login_auth_api.domain.base.BaseRepository;
import com.example.login_auth_api.domain.user.User;
import com.example.login_auth_api.exception.ApiException;
import com.example.login_auth_api.photo.PhotoUpload;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;


import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class AircraftService {

    /** Prefixo + marcas, com ou sem hífen: PR-FBA, PT-MXA, N123AB. */
    private static final Pattern REGISTRATION_FORMAT = Pattern.compile("^[A-Z0-9]{1,3}-?[A-Z0-9]{2,6}$");
    private static final String DUPLICATE_REGISTRATION = "Já existe uma aeronave com esta matrícula.";
    private static final String ENTITY = "AIRCRAFT";

    private final AircraftRepository aircraftRepository;
    private final AircraftPhotoRepository photoRepository;
    private final BaseRepository baseRepository;
    private final AuditService auditService;

    public AircraftService(AircraftRepository aircraftRepository,
                           AircraftPhotoRepository photoRepository,
                           BaseRepository baseRepository,
                           AuditService auditService) {
        this.aircraftRepository = aircraftRepository;
        this.photoRepository = photoRepository;
        this.baseRepository = baseRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<AircraftResponse> list(String search, String baseCode, AircraftStatus status) {
        Set<Long> withPhoto = photoRepository.findAircraftIdsWithPhoto();
        return aircraftRepository.findAll(AircraftSpecifications.matches(search, baseCode, status), Sort.by("registration"))
                .stream().map(a -> AircraftResponse.from(a, withPhoto.contains(a.getId()))).toList();
    }

    @Transactional(readOnly = true)
    public AircraftResponse get(Long id) {
        return response(find(id));
    }

    @Transactional
    public AircraftResponse create(AircraftRequest request, User actor, String ip) {
        Map<String, String> errors = validate(request, null);
        Base base = resolveBase(request.baseCode(), errors);
        throwIfInvalid(errors);

        Aircraft aircraft = new Aircraft(
                normalizeRegistration(request.registration()),
                request.model().trim(),
                request.manufacturer().trim(),
                request.serialNumber().trim(),
                base);
        aircraft.setStatus(request.status());
        aircraft.setTotalFlightHours(request.totalFlightHours());
        aircraft.setTotalCycles(request.totalCycles());
        aircraftRepository.save(aircraft);

        auditService.record(actor.getId(), AuditAction.AERONAVE_CRIADA, ENTITY, aircraft.getId(),
                "matrícula=" + aircraft.getRegistration() + "; modelo=" + aircraft.getModel()
                        + "; base=" + base.getCode() + "; horas=" + aircraft.getTotalFlightHours()
                        + "; ciclos=" + aircraft.getTotalCycles(), ip);
        return AircraftResponse.from(aircraft, false);
    }

    @Transactional
    public AircraftResponse update(Long id, AircraftRequest request, User actor, String ip) {
        Aircraft aircraft = find(id);
        Map<String, String> errors = validate(request, id);
        Base base = resolveBase(request.baseCode(), errors);
        throwIfInvalid(errors);

        String registration = normalizeRegistration(request.registration());
        List<String> changes = new ArrayList<>();
        track(changes, "matrícula", aircraft.getRegistration(), registration);
        track(changes, "fabricante", aircraft.getManufacturer(), request.manufacturer().trim());
        track(changes, "modelo", aircraft.getModel(), request.model().trim());
        track(changes, "número de série", aircraft.getSerialNumber(), request.serialNumber().trim());
        track(changes, "base", aircraft.getBase().getCode(), base.getCode());
        track(changes, "status", aircraft.getStatus().name(), request.status().name());
        if (aircraft.getTotalFlightHours().compareTo(request.totalFlightHours()) != 0) {
            track(changes, "horas", aircraft.getTotalFlightHours().toPlainString(), request.totalFlightHours().toPlainString());
        }
        track(changes, "ciclos", String.valueOf(aircraft.getTotalCycles()), String.valueOf(request.totalCycles()));

        aircraft.setRegistration(registration);
        aircraft.setManufacturer(request.manufacturer().trim());
        aircraft.setModel(request.model().trim());
        aircraft.setSerialNumber(request.serialNumber().trim());
        aircraft.setBase(base);
        aircraft.setStatus(request.status());
        aircraft.setTotalFlightHours(request.totalFlightHours());
        aircraft.setTotalCycles(request.totalCycles());

        if (!changes.isEmpty()) {
            auditService.record(actor.getId(), AuditAction.AERONAVE_ALTERADA, ENTITY, aircraft.getId(),
                    String.join("; ", changes), ip);
        }
        return response(aircraft);
    }

    // ---- foto ----

    @Transactional(readOnly = true)
    public AircraftPhoto getPhoto(Long id) {
        find(id);
        return photoRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Esta aeronave não tem foto cadastrada."));
    }

    /** Envia ou substitui a foto. */
    @Transactional
    public AircraftResponse savePhoto(Long id, MultipartFile file, User actor, String ip) {
        Aircraft aircraft = find(id);
        PhotoUpload upload = PhotoUpload.from(file);

        photoRepository.findById(id).ifPresentOrElse(
                photo -> photo.replace(upload.contentType(), upload.data()),
                () -> photoRepository.save(new AircraftPhoto(id, upload.contentType(), upload.data())));

        auditService.record(actor.getId(), AuditAction.AERONAVE_FOTO_ALTERADA, ENTITY, id,
                "matrícula=" + aircraft.getRegistration() + "; " + upload.describe(), ip);
        return AircraftResponse.from(aircraft, true);
    }

    @Transactional
    public AircraftResponse deletePhoto(Long id, User actor, String ip) {
        Aircraft aircraft = find(id);
        if (photoRepository.existsById(id)) {
            photoRepository.deleteById(id);
            auditService.record(actor.getId(), AuditAction.AERONAVE_FOTO_REMOVIDA, ENTITY, id,
                    "matrícula=" + aircraft.getRegistration(), ip);
        }
        return AircraftResponse.from(aircraft, false);
    }

    // ---- regras e validações ----

    private Map<String, String> validate(AircraftRequest request, Long id) {
        Map<String, String> errors = new LinkedHashMap<>();
        String registration = normalizeRegistration(request.registration());

        if (!REGISTRATION_FORMAT.matcher(registration).matches()) {
            errors.put("registration", "Matrícula inválida. Use o formato do prefixo, ex.: PR-FBA.");
        } else if (aircraftRepository.existsByRegistrationIgnoreCaseAndIdNot(registration, id == null ? 0L : id)) {
            errors.put("registration", DUPLICATE_REGISTRATION);
        }
        return errors;
    }

    private Base resolveBase(String code, Map<String, String> errors) {
        return baseRepository.findByCodeAndActiveTrue(code.trim().toUpperCase()).orElseGet(() -> {
            errors.put("baseCode", "Base inválida ou inativa: " + code + ".");
            return null;
        });
    }

    private AircraftResponse response(Aircraft aircraft) {
        return AircraftResponse.from(aircraft, photoRepository.existsById(aircraft.getId()));
    }

    private Aircraft find(Long id) {
        return aircraftRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Aeronave não encontrada."));
    }

    private static void throwIfInvalid(Map<String, String> errors) {
        if (!errors.isEmpty()) {
            HttpStatus status = DUPLICATE_REGISTRATION.equals(errors.get("registration"))
                    ? HttpStatus.CONFLICT : HttpStatus.BAD_REQUEST;
            throw new ApiException(status, "Verifique os campos informados.", errors);
        }
    }

    private static void track(List<String> changes, String field, String before, String after) {
        if (!Objects.equals(before, after)) {
            changes.add(field + ": " + (before == null ? "-" : before) + " -> " + (after == null ? "-" : after));
        }
    }

    private static String normalizeRegistration(String registration) {
        return registration.trim().toUpperCase();
    }
}
