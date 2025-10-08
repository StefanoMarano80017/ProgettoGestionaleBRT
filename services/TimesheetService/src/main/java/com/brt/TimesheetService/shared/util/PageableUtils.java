package com.brt.TimesheetService.shared.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public final class PageableUtils {

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 20;
    private static final int MAX_SIZE = 100;

    private PageableUtils() {
    }

    public static Pageable createSafePageable(Integer page, Integer size, String sortBy, String direction) {
        int safePage = (page == null || page < 0) ? DEFAULT_PAGE : page;
        int safeSize = (size == null || size < 1) ? DEFAULT_SIZE : Math.min(size, MAX_SIZE);

        Sort sort = Sort.unsorted();
        if (sortBy != null && !sortBy.isEmpty()) {
            sort = "desc".equalsIgnoreCase(direction) ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        }

        return PageRequest.of(safePage, safeSize, sort);
    }
}
