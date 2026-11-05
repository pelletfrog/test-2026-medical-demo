package io.github.pelletfrog.vitals.auth;

/**
 * JWT 有效，但對應的使用者已經不存在（例如帳號已刪除）時，一樣當成未登入。
 */
public class NotAuthenticatedException extends RuntimeException {

	public static final String DETAIL = "請先登入";

	public NotAuthenticatedException() {
		super(DETAIL);
	}

}
