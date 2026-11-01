package BusPassManagementSystem;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class DbTestController {

    private final DataSource dataSource;

    public DbTestController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();

        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement =
                     connection.prepareStatement("SELECT COUNT(*) AS cnt FROM users");
             ResultSet result = statement.executeQuery()) {

            result.next();
            body.put("status", "ok");
            body.put("users", result.getLong("cnt"));
            body.put("database", "connected");
            return ResponseEntity.ok(body);
        }
    }
}