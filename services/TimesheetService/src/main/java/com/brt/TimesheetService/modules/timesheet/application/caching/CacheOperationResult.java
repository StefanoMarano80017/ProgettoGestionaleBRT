package com.brt.TimesheetService.modules.timesheet.application.caching;

/**
 * Result wrapper per operazioni cache.
 */
public class CacheOperationResult<T> {

    private final boolean success;
    private final T value;
    private final Exception error;

    public CacheOperationResult(boolean success, T value, Exception error) {
        this.success = success;
        this.value = value;
        this.error = error;
    }

    public boolean isSuccess() {
        return success;
    }

    public T getValue() {
        return value;
    }

    public Exception getError() {
        return error;
    }
}
