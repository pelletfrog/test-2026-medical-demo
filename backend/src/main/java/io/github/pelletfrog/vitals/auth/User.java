package io.github.pelletfrog.vitals.auth;

import io.github.pelletfrog.vitals.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User extends BaseEntity {

	@Column(nullable = false, length = 50)
	private String username;

	@Column(nullable = false)
	private String passwordHash;

	@Column(nullable = false)
	private String name;

	protected User() {
	}

	public User(String username, String passwordHash, String name) {
		this.username = username;
		this.passwordHash = passwordHash;
		this.name = name;
	}

	public String getUsername() {
		return username;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public String getName() {
		return name;
	}

}
