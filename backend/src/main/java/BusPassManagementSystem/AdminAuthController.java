package BusPassManagementSystem;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(
        origins = {"http://localhost:5173", "http://127.0.0.1:5173"},
        allowCredentials = "true"
)
public class AdminAuthController {

    private static final int SESSION_TIMEOUT_SECONDS = 30 * 60;

    private final JdbcTemplate jdbcTemplate;

    public AdminAuthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest request) {

        String email = body == null ? null : body.get("email");
        String password = body == null ? null : body.get("password");

        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Email and password are required."));
        }

        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT user_id, full_name, email, role, password "
                            + "FROM users WHERE LOWER(email) = LOWER(?)",
                    email.trim());

            if (rows.isEmpty()) {
                return invalidCredentials();
            }

            Map<String, Object> account = rows.get(0);
            String role = account.get("role") == null ? "" : String.valueOf(account.get("role"));

            if (!"ADMIN".equalsIgnoreCase(role)) {
                return invalidCredentials();
            }

            String stored = account.get("password") == null
                    ? ""
                    : String.valueOf(account.get("password"));

            if (!matches(stored, password)) {
                return invalidCredentials();
            }

            HttpSession existing = request.getSession(false);
            if (existing != null) {
                existing.invalidate();
            }

            HttpSession session = request.getSession(true);
            session.setMaxInactiveInterval(SESSION_TIMEOUT_SECONDS);
            session.setAttribute(AdminSession.ADMIN_ID, account.get("user_id"));
            session.setAttribute(AdminSession.ADMIN_NAME, account.get("full_name"));
            session.setAttribute(AdminSession.ADMIN_EMAIL, account.get("email"));
            session.setAttribute(AdminSession.ADMIN_ROLE, "ADMIN");

            return ResponseEntity.ok(AdminSession.identity(session));

        } catch (DataAccessException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Sign-in is unavailable right now. Please try again."));
        }
    }

    @GetMapping("/session")
    public ResponseEntity<?> session(HttpServletRequest request) {
        HttpSession session = request.getSession(false);

        if (!AdminSession.isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Administrator sign-in required."));
        }

        return ResponseEntity.ok(AdminSession.identity(session));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", "Signed out.");
        return ResponseEntity.ok(body);
    }

    private static ResponseEntity<Map<String, String>> invalidCredentials() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Invalid email or password."));
    }

    private static boolean matches(String stored, String supplied) {
        return MessageDigest.isEqual(
                stored.getBytes(StandardCharsets.UTF_8),
                supplied.getBytes(StandardCharsets.UTF_8)
        );
    }
}
