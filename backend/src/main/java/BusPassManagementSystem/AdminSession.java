package BusPassManagementSystem;

import jakarta.servlet.http.HttpSession;

import java.util.LinkedHashMap;
import java.util.Map;

final class AdminSession {
    static final String ADMIN_ID = "adminUserId";
    static final String ADMIN_NAME = "adminName";
    static final String ADMIN_EMAIL = "adminEmail";
    static final String ADMIN_ROLE = "adminRole";

    private AdminSession() {
    }

    static boolean isAdmin(HttpSession session) {
        if (session == null) {
            return false;
        }
        Object id = session.getAttribute(ADMIN_ID);
        if (id == null || !(id instanceof Integer)) {
            return false;
        }
        return "ADMIN".equals(session.getAttribute(ADMIN_ROLE));
    }

    static Map<String, Object> identity(HttpSession session) {
        Map<String, Object> identity = new LinkedHashMap<>();
        identity.put("user_id", session.getAttribute(ADMIN_ID));
        identity.put("full_name", session.getAttribute(ADMIN_NAME));
        identity.put("email", session.getAttribute(ADMIN_EMAIL));
        identity.put("role", session.getAttribute(ADMIN_ROLE));
        return identity;
    }
}
