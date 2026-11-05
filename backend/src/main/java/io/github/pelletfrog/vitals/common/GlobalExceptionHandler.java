package io.github.pelletfrog.vitals.common;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

import io.github.pelletfrog.vitals.auth.InvalidCredentialsException;
import io.github.pelletfrog.vitals.auth.NotAuthenticatedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

	@Override
	protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		// 每個欄位只放一則：前端一個欄位下方只顯示一個錯誤
		Map<String, String> errors = new LinkedHashMap<>();
		for (FieldError error : ex.getBindingResult().getFieldErrors()) {
			errors.putIfAbsent(error.getField(), error.getDefaultMessage());
		}

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
