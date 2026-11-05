package io.github.pelletfrog.vitals.common;

import java.util.List;
import java.util.function.Function;

import org.springframework.data.domain.Page;

/**
 * 列表的分頁回應，頁碼從 1 開始，見 docs/conventions.md §1.9。
 * 不用 Spring 內建的分頁回應：它的頁碼從 0 開始，和請求參數不一致。
 */
public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {

	public static <E, T> PageResponse<T> from(Page<E> page, Function<E, T> mapper) {
		return new PageResponse<>(
				page.getContent().stream().map(mapper).toList(),
				page.getNumber() + 1,
				page.getSize(),
				page.getTotalElements(),
				page.getTotalPages());
	}

}
