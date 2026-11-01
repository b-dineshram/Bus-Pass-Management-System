export const API_BASE = "http://localhost:8080/api";

export class ApiError extends Error {
    constructor(message, status = 0) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

export async function request(path, options = {}) {
    let response;

    try {
        response = await fetch(`${API_BASE}${path}`, {
            credentials: "include",
            ...options,
        });
    } catch {
        throw new ApiError(
            "We could not reach the transport service. Please check your connection and try again.",
        );
    }

    const text = await response.text();
    let payload = null;

    if (text) {
        try {
            payload = JSON.parse(text);
        } catch {
            payload = null;
        }
    }

    if (!response.ok) {
        throw new ApiError(
            payload?.message || "Something went wrong. Please try again.",
            response.status,
        );
    }

    return payload;
}

function postJson(body) {
    return {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    };
}

export const transitApi = {
    routes: () => request("/routes"),
    passTypes: () => request("/pass-types"),
    register: (form) => request("/users/register", postJson(form)),
    apply: (form) => request("/applications", postJson(form)),
    application: (reference) =>
        request(`/applications/${encodeURIComponent(reference)}`),
};

export const adminApi = {
    session: () => request("/admin/session"),
    login: (email, password) =>
        request("/admin/login", postJson({ email, password })),
    logout: () => request("/admin/logout", { method: "POST" }),
    students: () => request("/users"),
    applications: () => request("/applications"),
    decide: (applicationId, status) =>
        request(
            `/applications/${encodeURIComponent(applicationId)}/status`,
            postJson({ status }),
        ),
};
