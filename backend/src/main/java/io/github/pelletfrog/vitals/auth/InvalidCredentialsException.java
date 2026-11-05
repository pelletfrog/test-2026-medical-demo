package io.github.pelletfrog.vitals.auth;

public class InvalidCredentialsException extends RuntimeException {

	public InvalidCredentialsException() {
		super("帳號或密碼錯誤");
	}

}
