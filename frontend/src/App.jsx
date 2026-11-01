import { useCallback, useEffect, useState } from "react";
import { adminApi } from "./api";
import StudentPortal from "./StudentPortal";
import AdminLogin from "./AdminLogin";
import AdminPortal from "./AdminPortal";
import { Brand } from "./components";
import "./App.css";

const STUDENT_ROUTES = ["/", "/register", "/apply", "/track"];

function normalisePath(path) {
    const trimmed = String(path || "/").replace(/\/+$/, "");

    return trimmed || "/";
}

function usePathname() {
    const [pathname, setPathname] = useState(() =>
        normalisePath(window.location.pathname),
    );

    useEffect(() => {
        const handlePopState = () =>
            setPathname(normalisePath(window.location.pathname));

        window.addEventListener("popstate", handlePopState);

        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    const navigate = useCallback((to, replace = false) => {
        const target = normalisePath(to);

        if (window.location.pathname !== target) {
            if (replace) {
                window.history.replaceState({}, "", target);
            } else {
                window.history.pushState({}, "", target);
            }
        }

        setPathname(target);
        window.scrollTo(0, 0);
    }, []);

    return [pathname, navigate];
}

function Boot({ label = "Loading…" }) {
    return (
        <div className="boot">
            <Brand subtitle="Bus Pass Management" />
            <p>{label}</p>
        </div>
    );
}

export default function App() {
    const [pathname, navigate] = usePathname();
    const [admin, setAdmin] = useState(null);
    const [checkingSession, setCheckingSession] = useState(true);

    useEffect(() => {
        let active = true;

        adminApi
            .session()
            .then((identity) => {
                if (active) setAdmin(identity);
            })
            .catch(() => {
                if (active) setAdmin(null);
            })
            .finally(() => {
                if (active) setCheckingSession(false);
            });

        return () => {
            active = false;
        };
    }, []);

    const isAdminArea =
        pathname === "/admin" || pathname === "/admin/login";

    useEffect(() => {
        if (isAdminArea) {
            if (checkingSession) return;

            if (!admin && pathname !== "/admin/login") {
                navigate("/admin/login", true);
            } else if (admin && pathname === "/admin/login") {
                navigate("/admin", true);
            }

            return;
        }

        if (!STUDENT_ROUTES.includes(pathname)) {
            navigate("/", true);
        }
    }, [pathname, admin, checkingSession, isAdminArea, navigate]);

    const handleSignedIn = useCallback(
        (identity) => {
            setAdmin(identity);
            navigate("/admin", true);
        },
        [navigate],
    );

    const handleSignOut = useCallback(async () => {
        try {
            await adminApi.logout();
        } catch {
            // The session may already have expired; local state is cleared below.
        }

        setAdmin(null);
        navigate("/admin/login", true);
    }, [navigate]);

    const handleSessionExpired = useCallback(() => {
        setAdmin(null);
        navigate("/admin/login", true);
    }, [navigate]);

    if (isAdminArea) {
        if (checkingSession) {
            return <Boot label="Loading administration…" />;
        }

        if (pathname === "/admin/login") {
            if (admin) {
                return <Boot label="Opening dashboard…" />;
            }

            return (
                <AdminLogin
                    onSignedIn={handleSignedIn}
                    onBack={() => navigate("/")}
                />
            );
        }

        if (!admin) {
            return <Boot label="Redirecting to sign-in…" />;
        }

        return (
            <AdminPortal
                admin={admin}
                onSignOut={handleSignOut}
                onSessionExpired={handleSessionExpired}
                onOpenStudentPortal={() => navigate("/")}
            />
        );
    }

    return <StudentPortal pathname={pathname} navigate={navigate} />;
}
