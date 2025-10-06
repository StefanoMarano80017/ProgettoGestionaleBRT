package com.brt.TimesheetService.interceptor;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.MethodParameter;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Interceptor globale per formattare automaticamente le risposte paginabili.
 * 
 * Trasforma ResponseEntity<Page<?>> in un JSON arricchito con:
 *  - metadati (page, size, sort, filters)
 *  - link assoluti (self, next, prev)
 */
@Component
public class PaginationResponseInterceptor implements ResponseBodyAdvice<Object> {

    @Autowired(required = false)
    private HttpServletRequest request;

    @Override
    public boolean supports(MethodParameter returnType, Class converterType) {
        // Intercetta solo metodi che ritornano ResponseEntity<Page<?>>
        return ResponseEntity.class.isAssignableFrom(returnType.getParameterType());
    }

    @Override
    public Object beforeBodyWrite(
                                    Object body,
                                    MethodParameter returnType,
                                    MediaType selectedContentType,
                                    Class selectedConverterType,
                                    ServerHttpRequest serverRequest,
                                    ServerHttpResponse response
    ) {

        // Recupera la HttpServletRequest dal contesto
        HttpServletRequest req = request;
        if (req == null && RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs) {
            req = attrs.getRequest();
        }

        // Se il body è una ResponseEntity contenente Page<?>
        if (body instanceof ResponseEntity<?> entity && entity.getBody() instanceof Page<?> page) {
            return build(page, req);
        }

        // Se non è una Page, restituisci invariato
        return body;
    }

     public static <T> ResponseEntity<Map<String, Object>> build(Page<T> page, HttpServletRequest request) {

        Map<String, Object> response = new HashMap<>();

        // Contenuto della pagina
        response.put("content", page.getContent());
        response.put("page", page.getNumber());
        response.put("size", page.getSize());
        response.put("totalElements", page.getTotalElements());
        response.put("totalPages", page.getTotalPages());
        response.put("first", page.isFirst());
        response.put("last", page.isLast());
        response.put("empty", page.isEmpty());

        // Metadati addizionali
        response.put("sort", page.getSort().toString());
        response.put("filters", extractFilters(request));

        // Link assoluti per navigazione
        Map<String, String> links = new HashMap<>();
        links.put("self", buildPageLink(request, page.getNumber()));
        if (!page.isFirst()) {
            links.put("prev", buildPageLink(request, page.getNumber() - 1));
        }
        if (!page.isLast()) {
            links.put("next", buildPageLink(request, page.getNumber() + 1));
        }
        response.put("_links", links);

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    // Ricostruisce un link assoluto mantenendo i parametri esistenti
    private static String buildPageLink(HttpServletRequest request, int targetPage) {
        String queryString = request.getQueryString();
        String baseUrl = request.getRequestURL().toString();

        // Sostituisci o aggiungi "page"
        if (queryString != null && !queryString.isEmpty()) {
            if (queryString.contains("page=")) {
                queryString = queryString.replaceAll("page=\\d+", "page=" + targetPage);
            } else {
                queryString += "&page=" + targetPage;
            }
        } else {
            queryString = "page=" + targetPage;
        }

        return URI.create(baseUrl + "?" + queryString).toString();
    }

    // Estrae i filtri dalla query string (esclude page e size)
    private static Map<String, String> extractFilters(HttpServletRequest request) {
        if (request.getParameterMap().isEmpty()) return Map.of();
        return request.getParameterMap().entrySet().stream()
                .filter(e -> !e.getKey().equalsIgnoreCase("page") && !e.getKey().equalsIgnoreCase("size"))
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> String.join(",", e.getValue())
                ));
    }

}
