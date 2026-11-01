package BusPassManagementSystem;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api")
@CrossOrigin(
        origins = {"http://localhost:5173", "http://127.0.0.1:5173"},
        allowCredentials = "true"
)
public class ApiController {

    private static final String APPLICATION_CODE_PREFIX = "APP-";

    // Student applications are always created as NEW: the column is NOT NULL
    // and the UI does not collect an application type.
    private static final String DEFAULT_APPLICATION_TYPE = "NEW";

    private static final Set<String> DECISIONS = Set.of("APPROVED", "REJECTED");

    private static final String APPLICATION_SELECT = """
            SELECT a.application_id,
                   a.application_type,
                   a.status,
                   DATE_FORMAT(a.applied_at, '%Y-%m-%d %H:%i') AS applied_at,
                   u.user_id,
                   u.full_name AS student_name,
                   u.email AS student_email,
                   r.route_id,
                   r.route_name,
                   r.source,
                   r.destination,
                   r.fare,
                   p.pass_type_id,
                   p.type_name,
                   p.duration_months,
                   p.fee
            FROM applications a
            JOIN users u ON u.user_id = a.user_id
            JOIN routes r ON r.route_id = a.route_id
            JOIN pass_types p ON p.pass_type_id = a.pass_type_id
            """;

    private final JdbcTemplate jdbcTemplate;

    public ApiController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // ---------------------------------------------------------------------
    // Users
    // ---------------------------------------------------------------------

    // Get all registered users (administrator only)
    @GetMapping("/users")
    public ResponseEntity<?> getUsers(HttpServletRequest request) {
        if (!AdminSession.isAdmin(request.getSession(false))) {
            return message(HttpStatus.UNAUTHORIZED, "Administrator sign-in required.");
        }

        return ResponseEntity.ok(jdbcTemplate.queryForList(
                "SELECT user_id, full_name, email, role FROM users ORDER BY user_id"
        ));
    }

    // Register a new student
    @PostMapping("/users/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> user) {

        String fullName = user.get("full_name");
        String email = user.get("email");
        String password = user.get("password");

        if (fullName == null || fullName.isBlank()
                || email == null || email.isBlank()
                || password == null || password.isBlank()) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", "All fields are required."));
        }

        try {
            KeyHolder keyHolder = new GeneratedKeyHolder();

            jdbcTemplate.update(connection -> {
                PreparedStatement statement = connection.prepareStatement(
                        "INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)",
                        Statement.RETURN_GENERATED_KEYS);

                statement.setString(1, fullName);
                statement.setString(2, email);
                statement.setString(3, password);

                return statement;
            }, keyHolder);

            Number studentId = keyHolder.getKey();

            if (studentId != null) {
                return ResponseEntity
                        .status(HttpStatus.CREATED)
                        .body(Map.of(
                                "message", "Student registered successfully.",
                                "user_id", studentId.intValue()
                        ));
            }

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Registration failed."));

        } catch (DataAccessException e) {

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Email already registered."));
        }
    }

    // ---------------------------------------------------------------------
    // Routes and pass types (form options, loaded from MySQL)
    // ---------------------------------------------------------------------

    @GetMapping("/routes")
    public List<Map<String, Object>> getRoutes() {
        return jdbcTemplate.queryForList(
                "SELECT route_id, route_name, source, destination, fare "
                        + "FROM routes ORDER BY route_id"
        );
    }

    @GetMapping("/pass-types")
    public List<Map<String, Object>> getPassTypes() {
        return jdbcTemplate.queryForList(
                "SELECT pass_type_id, type_name, duration_months, fee "
                        + "FROM pass_types ORDER BY pass_type_id"
        );
    }

    // ---------------------------------------------------------------------
    // Applications
    // ---------------------------------------------------------------------

    // Submit a new bus pass application
    @PostMapping("/applications")
    public ResponseEntity<?> createApplication(@RequestBody Map<String, Object> request) {

        Integer userId = parseId(request.get("user_id"));
        Integer routeId = parseId(request.get("route_id"));
        Integer passTypeId = parseId(request.get("pass_type_id"));

        if (userId == null || routeId == null || passTypeId == null) {
            return message(HttpStatus.BAD_REQUEST,
                    "A valid student ID, route and pass type are required.");
        }

        try {
            List<String> roles = jdbcTemplate.queryForList(
                    "SELECT role FROM users WHERE user_id = ?", String.class, userId);

            if (roles.isEmpty()) {
                return message(HttpStatus.NOT_FOUND,
                        "No student is registered with ID " + userId + ".");
            }

            if (!"STUDENT".equalsIgnoreCase(roles.get(0))) {
                return message(HttpStatus.BAD_REQUEST,
                        "Only student accounts can apply for a bus pass.");
            }

            if (!exists("SELECT COUNT(*) FROM routes WHERE route_id = ?", routeId)) {
                return message(HttpStatus.BAD_REQUEST,
                        "The selected route does not exist.");
            }

            if (!exists("SELECT COUNT(*) FROM pass_types WHERE pass_type_id = ?", passTypeId)) {
                return message(HttpStatus.BAD_REQUEST,
                        "The selected pass type does not exist.");
            }

            KeyHolder keyHolder = new GeneratedKeyHolder();

            jdbcTemplate.update(connection -> {
                PreparedStatement statement = connection.prepareStatement(
                        "INSERT INTO applications "
                                + "(user_id, route_id, pass_type_id, application_type) "
                                + "VALUES (?, ?, ?, ?)",
                        Statement.RETURN_GENERATED_KEYS);

                statement.setInt(1, userId);
                statement.setInt(2, routeId);
                statement.setInt(3, passTypeId);
                statement.setString(4, DEFAULT_APPLICATION_TYPE);

                return statement;
            }, keyHolder);

            Number generatedKey = keyHolder.getKey();

            if (generatedKey == null) {
                return message(HttpStatus.INTERNAL_SERVER_ERROR,
                        "The application was saved but its ID could not be read.");
            }

            Map<String, Object> created = findApplication(generatedKey.intValue());

            if (created == null) {
                return message(HttpStatus.INTERNAL_SERVER_ERROR,
                        "The application was saved but could not be reloaded.");
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(created);

        } catch (DataAccessException e) {
            return message(HttpStatus.INTERNAL_SERVER_ERROR,
                    "The application could not be saved. Please try again.");
        }
    }

    // All applications, for the admin dashboard (administrator only)
    @GetMapping("/applications")
    public ResponseEntity<?> getApplications(HttpServletRequest request) {
        if (!AdminSession.isAdmin(request.getSession(false))) {
            return message(HttpStatus.UNAUTHORIZED, "Administrator sign-in required.");
        }

        return ResponseEntity.ok(
                jdbcTemplate.queryForList(APPLICATION_SELECT + " ORDER BY a.application_id DESC")
                        .stream()
                        .map(this::withApplicationCode)
                        .toList()
        );
    }

    // Track one application. Accepts APP-00001 or the numeric id.
    @GetMapping("/applications/{reference}")
    public ResponseEntity<?> getApplication(@PathVariable String reference) {

        Integer applicationId = parseId(reference);

        if (applicationId == null) {
            return message(HttpStatus.BAD_REQUEST,
                    "Application ID must look like APP-00001 or a number.");
        }

        try {
            Map<String, Object> application = findApplication(applicationId);

            if (application == null) {
                return message(HttpStatus.NOT_FOUND,
                        "No application found with ID " + formatApplicationCode(applicationId) + ".");
            }

            return ResponseEntity.ok(application);

        } catch (DataAccessException e) {
            return message(HttpStatus.INTERNAL_SERVER_ERROR,
                    "The application could not be loaded. Please try again.");
        }
    }

    // Approve or reject an application (administrator only)
    @PostMapping("/applications/{reference}/status")
    public ResponseEntity<?> updateApplicationStatus(
            @PathVariable String reference,
            @RequestBody(required = false) Map<String, Object> request,
            HttpServletRequest httpRequest) {

        if (!AdminSession.isAdmin(httpRequest.getSession(false))) {
            return message(HttpStatus.UNAUTHORIZED, "Administrator sign-in required.");
        }

        Integer applicationId = parseId(reference);

        if (applicationId == null) {
            return message(HttpStatus.BAD_REQUEST,
                    "Application ID must look like APP-00001 or a number.");
        }

        Object rawStatus = request == null ? null : request.get("status");
        String status = rawStatus == null
                ? ""
                : String.valueOf(rawStatus).trim().toUpperCase(Locale.ROOT);

        if (!DECISIONS.contains(status)) {
            return message(HttpStatus.BAD_REQUEST,
                    "Status must be APPROVED or REJECTED.");
        }

        try {
            if (!exists("SELECT COUNT(*) FROM applications WHERE application_id = ?", applicationId)) {
                return message(HttpStatus.NOT_FOUND,
                        "No application found with ID " + formatApplicationCode(applicationId) + ".");
            }

            jdbcTemplate.update(
                    "UPDATE applications SET status = ? WHERE application_id = ?",
                    status,
                    applicationId
            );

            return ResponseEntity.ok(findApplication(applicationId));

        } catch (DataAccessException e) {
            return message(HttpStatus.INTERNAL_SERVER_ERROR,
                    "The status could not be updated. Please try again.");
        }
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private Map<String, Object> findApplication(int applicationId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                APPLICATION_SELECT + " WHERE a.application_id = ?", applicationId);

        return rows.isEmpty() ? null : withApplicationCode(rows.get(0));
    }

    private Map<String, Object> withApplicationCode(Map<String, Object> row) {
        Map<String, Object> application = new LinkedHashMap<>(row);
        Object id = row.get("application_id");

        application.put("application_code",
                id instanceof Number number ? formatApplicationCode(number.intValue()) : null);

        return application;
    }

    private static String formatApplicationCode(int applicationId) {
        return String.format("%s%05d", APPLICATION_CODE_PREFIX, applicationId);
    }

    /**
     * Accepts a number or a readable code such as APP-00001.
     * Returns null when the value is missing, non-numeric or not positive.
     */
    private static Integer parseId(Object raw) {
        if (raw == null) {
            return null;
        }

        if (raw instanceof Number number) {
            int value = number.intValue();
            return value > 0 ? value : null;
        }

        String text = String.valueOf(raw).trim().toUpperCase(Locale.ROOT);

        if (text.startsWith(APPLICATION_CODE_PREFIX)) {
            text = text.substring(APPLICATION_CODE_PREFIX.length());
        }

        if (text.isEmpty() || text.length() > 9) {
            return null;
        }

        for (int i = 0; i < text.length(); i++) {
            if (!Character.isDigit(text.charAt(i))) {
                return null;
            }
        }

        try {
            int value = Integer.parseInt(text);
            return value > 0 ? value : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private boolean exists(String sql, int id) {
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, id);
        return count != null && count > 0;
    }

    private static ResponseEntity<Map<String, Object>> message(HttpStatus status, String text) {
        return ResponseEntity.status(status).body(Map.of("message", text));
    }
}
