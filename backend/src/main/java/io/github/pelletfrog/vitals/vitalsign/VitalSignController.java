package io.github.pelletfrog.vitals.vitalsign;

import io.github.pelletfrog.vitals.common.PageResponse;
import io.github.pelletfrog.vitals.vitalsign.dto.PatientOptionsResponse;
import io.github.pelletfrog.vitals.vitalsign.dto.VitalSignCreateRequest;
import io.github.pelletfrog.vitals.vitalsign.dto.VitalSignResponse;
import io.github.pelletfrog.vitals.vitalsign.dto.VitalSignUpdateRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vital-signs")
public class VitalSignController {

	private final VitalSignService vitalSignService;

	public VitalSignController(VitalSignService vitalSignService) {
		this.vitalSignService = vitalSignService;
	}

	@GetMapping
	public PageResponse<VitalSignResponse> list(@RequestParam(required = false) String keyword, Pageable pageable) {
		return PageResponse.from(vitalSignService.list(keyword, pageable), VitalSignResponse::from);
	}

	// 選擇病患用生命徵象自己的 API：之後依權限控管時，和病患列表可以分開
	@GetMapping("/patient-options")
	public PatientOptionsResponse patientOptions(@RequestParam(required = false) String keyword) {
		return vitalSignService.patientOptions(keyword);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public VitalSignResponse create(@Valid @RequestBody VitalSignCreateRequest request) {
		return VitalSignResponse.from(vitalSignService.create(request));
	}

	@PutMapping("/{id}")
	public VitalSignResponse update(@PathVariable Long id, @Valid @RequestBody VitalSignUpdateRequest request) {
		return VitalSignResponse.from(vitalSignService.update(id, request));
	}

}
