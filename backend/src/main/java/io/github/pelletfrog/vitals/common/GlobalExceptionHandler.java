package io.github.pelletfrog.vitals.common;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import io.github.pelletfrog.vitals.auth.InvalidCredentialsException;
import io.github.pelletfrog.vitals.auth.NotAuthenticatedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * 錯誤一律回 ProblemDetail，格式見 docs/conventions.md §1.4。
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	static final String FIELD_ERRORS_SUMMARY = "請修正標示的欄位";

	// 同一個欄位違反多條規則時，依這個順序只顯示一則：先填、再改長度或範圍、最後改格式；
	// Spring 回報欄位錯誤的順序不固定，不排序的話同樣的輸入每次訊息可能不同
	private static final List<String> FIELD_ERROR_PRIORITY = List.of(
			"NotBlank", "NotNull", "Size", "DecimalMin", "DecimalMax", "Digits", "Pattern", "PastOrPresent");

	private record FieldConflict(String field, String message) {
	}

	// 唯一約束名稱 → 欄位與訊息；約束命名見 conventions §1.5
	private static final Map<String, FieldConflict> UNIQUE_CONSTRAINTS = Map.of(
			"uk_patients_medical_record_no", new FieldConflict("medicalRecordNo", "病歷號已存在"),
			"uk_vital_signs_patient_id_measured_at", new FieldConflict("measuredAt", "這個時間已經有紀錄"));

	@Override
	protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		// 每個欄位只放一則：前端一個欄位下方只顯示一個錯誤
		Map<String, String> errors = new LinkedHashMap<>();
		ex.getBindingResult().getFieldErrors().stream()
				.sorted(Comparator.comparingInt(GlobalExceptionHandler::priority))
				.forEach(error -> errors.putIfAbsent(error.getField(), error.getDefaultMessage()));

		// 不能歸給某個欄位的錯誤寫在 detail；只有欄位錯誤時，detail 只寫摘要，不重複欄位訊息
		String globalMessages = ex.getBindingResult().getGlobalErrors().stream()
				.map(e -> e.getDefaultMessage())
				.collect(Collectors.joining("；"));

		ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
				globalMessages.isEmpty() ? FIELD_ERRORS_SUMMARY : globalMessages);
		if (!errors.isEmpty()) {
			problem.setProperty("errors", errors);
		}
		return ResponseEntity.badRequest().body(problem);
	}

	@Override
	protected ResponseEntity<Object> handleHttpMessageNotReadable(HttpMessageNotReadableException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		return ResponseEntity.badRequest()
				.body(ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "請求格式錯誤"));
	}

	private static int priority(FieldError error) {
		int index = FIELD_ERROR_PRIORITY.indexOf(error.getCode());
		return index < 0 ? FIELD_ERROR_PRIORITY.size() : index;
	}

	@ExceptionHandler(DataIntegrityViolationException.class)
	ProblemDetail dataIntegrityViolation(DataIntegrityViolationException ex) {
		FieldConflict conflict = ex.getCause() instanceof org.hibernate.exception.ConstraintViolationException cve
				? UNIQUE_CONSTRAINTS.get(cve.getConstraintName())
				: null;
		if (conflict == null) {
			// 其他約束錯誤表示 API 的驗證漏擋了，是程式的問題
			return unexpected(ex);
		}
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, FIELD_ERRORS_SUMMARY);
		problem.setProperty("errors", Map.of(conflict.field(), conflict.message()));
		return problem;
	}

	@ExceptionHandler(FieldErrorException.class)
	ProblemDetail fieldError(FieldErrorException ex) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, FIELD_ERRORS_SUMMARY);
		problem.setProperty("errors", Map.of(ex.getField(), ex.getMessage()));
		return problem;
	}

	@ExceptionHandler(NotFoundException.class)
	ProblemDetail notFound(NotFoundException ex) {
		return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
	}

	@ExceptionHandler(InvalidCredentialsException.class)
	ProblemDetail invalidCredentials() {
		// 不說明是帳號還是密碼錯：避免被拿來試出哪些帳號存在
		return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "帳號或密碼錯誤");
	}

	@ExceptionHandler(NotAuthenticatedException.class)
	ProblemDetail notAuthenticated() {
		return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, NotAuthenticatedException.DETAIL);
	}

	@ExceptionHandler(Exception.class)
	ProblemDetail unexpected(Exception ex) {
		// 例外內容只記在 log，不回給前端：避免洩漏系統內部資訊
		log.error("未預期的錯誤", ex);
		return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "系統發生錯誤，請稍後再試");
	}

}
