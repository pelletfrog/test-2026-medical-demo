package io.github.pelletfrog.vitals.patient;

import io.github.pelletfrog.vitals.common.PageResponse;
import io.github.pelletfrog.vitals.patient.dto.PatientRequest;
import io.github.pelletfrog.vitals.patient.dto.PatientResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

	private final PatientService patientService;

	public PatientController(PatientService patientService) {
		this.patientService = patientService;
	}

	@GetMapping
	public PageResponse<PatientResponse> list(
			@RequestParam(required = false) String medicalRecordNo,
			Pageable pageable) {
		return PageResponse.from(patientService.list(medicalRecordNo, pageable), PatientResponse::from);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public PatientResponse create(@Valid @RequestBody PatientRequest request) {
		return PatientResponse.from(patientService.create(request.medicalRecordNo(), request.name()));
	}

}
