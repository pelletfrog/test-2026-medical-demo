package io.github.pelletfrog.vitals.auth.dto;

import io.github.pelletfrog.vitals.auth.User;

public record MeResponse(Long id, String username, String name) {

	public static MeResponse from(User user) {
		return new MeResponse(user.getId(), user.getUsername(), user.getName());
	}

}
