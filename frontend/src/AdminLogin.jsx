import { useState } from "react";
import { adminApi } from "./api";
import { Brand, Field } from "./components";

export default function AdminLogin({ onSignedIn, onBack }) {
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        setError("");

        const email = form.email.trim();
        const password = form.password;

        if (!email || !password) {
            setError("Enter your administrator email and password.");
            return;
        }

        setBusy(true);

        try {
            const identity = await adminApi.login(email, password);
            onSignedIn(identity);
        } catch (failure) {
            setError(failure.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="auth">
            <aside className="auth__brand">
                <Brand subtitle="Administration" onDark />

                <div className="auth__statement">
                    <h2>The transport office workspace.</h2>
                    <p>
                        Review student applications, keep records accurate and
                        record decisions for every campus route.
                    </p>
                </div>

                <ul className="auth__points">
                    <li>Student and application records in one place</li>
                    <li>Approve or reject requests with a clear trail</li>
                    <li>Access limited to administrator accounts</li>
                </ul>
            </aside>

            <main className="auth__panel">
                <div className="auth__card">
                    <span className="eyebrow">Staff area</span>
                    <h1>Administrator sign-in</h1>
                    <p className="auth__lead">
                        Sign in with the administrator account issued by the
                        transport office.
                    </p>

                    <form onSubmit={submit} noValidate>
                        {error && (
                            <div className="alert alert--error" role="alert">
                                {error}
                            </div>
                        )}

                        <Field id="admin_email" label="Email address">
                            <input
                                id="admin_email"
                                name="email"
                                type="email"
                                autoComplete="username"
                                autoFocus
                                placeholder="name@campus.edu"
                                value={form.email}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        email: event.target.value,
                                    })
                                }
                            />
                        </Field>

                        <Field id="admin_password" label="Password">
                            <input
                                id="admin_password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                placeholder="Your password"
                                value={form.password}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        password: event.target.value,
                                    })
                                }
                            />
                        </Field>

                        <button
                            type="submit"
                            className="btn btn--primary btn--block"
                            disabled={busy}
                        >
                            {busy ? "Signing in…" : "Sign in"}
                        </button>
                    </form>

                    <div className="auth__footer">
                        <button type="button" className="linkish" onClick={onBack}>
                            Return to the student portal
                        </button>
                    </div>
                </div>

                <p className="auth__legal">
                    Campus Transport · Administrative access
                </p>
            </main>
        </div>
    );
}
