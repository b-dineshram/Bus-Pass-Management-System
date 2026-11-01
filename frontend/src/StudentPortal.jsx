import { useEffect, useState } from "react";
import { transitApi } from "./api";
import { formatDuration, formatMoney } from "./format";
import {
    ApplicationResult,
    Brand,
    Field,
    PageHeader,
} from "./components";

const NAV = [
    ["/", "Home"],
    ["/register", "Register"],
    ["/apply", "Apply Pass"],
    ["/track", "Track Status"],
];

export default function StudentPortal({ pathname, navigate }) {
    const [routes, setRoutes] = useState([]);
    const [passTypes, setPassTypes] = useState([]);
    const [optionsError, setOptionsError] = useState("");
    const [optionsReloadKey, setOptionsReloadKey] = useState(0);

    useEffect(() => {
        let active = true;

        transitApi
            .routes()
            .then((rows) => {
                if (active) setRoutes(rows);
            })
            .catch((error) => {
                if (active) setOptionsError(error.message);
            });

        transitApi
            .passTypes()
            .then((rows) => {
                if (active) setPassTypes(rows);
            })
            .catch((error) => {
                if (active) setOptionsError(error.message);
            });

        return () => {
            active = false;
        };
    }, [optionsReloadKey]);

    const [registerForm, setRegisterForm] = useState({
        full_name: "",
        email: "",
        password: "",
    });
    const [registerError, setRegisterError] = useState("");
    const [registering, setRegistering] = useState(false);
    const [registeredStudent, setRegisteredStudent] = useState(null);

    const [applyForm, setApplyForm] = useState({
        student_id: "",
        route_id: "",
        pass_type_id: "",
    });
    const [applyError, setApplyError] = useState("");
    const [applying, setApplying] = useState(false);
    const [submitted, setSubmitted] = useState(null);

    const [statusQuery, setStatusQuery] = useState("");
    const [statusResult, setStatusResult] = useState(null);
    const [statusError, setStatusError] = useState("");
    const [statusLoading, setStatusLoading] = useState(false);

    const go = (path) => navigate(path);

    const startApplication = (studentId) => {
        setSubmitted(null);
        setApplyError("");
        setApplyForm({
            student_id: studentId ? String(studentId) : "",
            route_id: "",
            pass_type_id: "",
        });
        go("/apply");
    };

    const registerStudent = async (event) => {
        event.preventDefault();
        setRegisterError("");

        const fullName = registerForm.full_name.trim();
        const email = registerForm.email.trim();
        const password = registerForm.password;

        if (!fullName || !email || !password) {
            setRegisterError(
                "Enter your full name, email address and password.",
            );
            return;
        }

        setRegistering(true);

        try {
            const saved = await transitApi.register({
                full_name: fullName,
                email,
                password,
            });

            setRegisteredStudent({
                user_id: saved?.user_id ?? null,
                full_name: fullName,
                email,
            });
            setRegisterForm({ full_name: "", email: "", password: "" });
        } catch (error) {
            setRegisterError(error.message);
        } finally {
            setRegistering(false);
        }
    };

    const submitApplication = async (event) => {
        event.preventDefault();
        setApplyError("");

        const studentId = Number(applyForm.student_id);

        if (
            !applyForm.student_id.trim() ||
            !Number.isInteger(studentId) ||
            studentId <= 0
        ) {
            setApplyError("Enter a valid student reference number.");
            return;
        }

        if (!applyForm.route_id || !applyForm.pass_type_id) {
            setApplyError("Choose a route and a pass type to continue.");
            return;
        }

        setApplying(true);

        try {
            const application = await transitApi.apply({
                user_id: studentId,
                route_id: Number(applyForm.route_id),
                pass_type_id: Number(applyForm.pass_type_id),
            });

            setSubmitted(application);
            setApplyForm({
                student_id: "",
                route_id: "",
                pass_type_id: "",
            });
        } catch (error) {
            setApplyError(error.message);
        } finally {
            setApplying(false);
        }
    };

    const lookupApplication = async (referenceInput) => {
        const reference = String(referenceInput ?? statusQuery).trim();

        setStatusError("");
        setStatusResult(null);

        if (!reference) {
            setStatusError(
                "Enter the application number shown after you applied.",
            );
            return;
        }

        setStatusLoading(true);

        try {
            const application = await transitApi.application(reference);
            setStatusResult(application);
        } catch (error) {
            setStatusError(error.message);
        } finally {
            setStatusLoading(false);
        }
    };

    const trackApplication = (code) => {
        go("/track");
        setStatusQuery(code);
        setStatusResult(null);
        setStatusError("");
        lookupApplication(code);
    };

    return (
        <div className="app">
            <header className="site-header">
                <div className="site-header__inner">
                    <Brand onClick={() => go("/")} />

                    <nav className="nav" aria-label="Main">
                        {NAV.map(([path, label]) => (
                            <button
                                key={path}
                                type="button"
                                className={
                                    pathname === path
                                        ? "nav__link is-active"
                                        : "nav__link"
                                }
                                aria-current={
                                    pathname === path ? "page" : undefined
                                }
                                onClick={() =>
                                    path === "/apply"
                                        ? startApplication()
                                        : go(path)
                                }
                            >
                                {label}
                            </button>
                        ))}

                        <span className="nav__divider" aria-hidden="true" />

                        <button
                            type="button"
                            className="nav__staff"
                            onClick={() => go("/admin/login")}
                        >
                            Staff sign-in
                        </button>
                    </nav>
                </div>
            </header>

            <main className="page">
                {pathname === "/" && (
                    <>
                        <section className="hero">
                            <div className="hero__copy">
                                <span className="eyebrow">
                                    Campus transport services
                                </span>

                                <h1>
                                    Your campus bus pass,
                                    <br />
                                    handled in one place.
                                </h1>

                                <p className="hero__lead">
                                    Apply for a route pass, follow your
                                    application and keep your student travel
                                    record in order. The transport office reviews
                                    every submission before a pass is issued.
                                </p>

                                <div className="btn-row">
                                    <button
                                        type="button"
                                        className="btn btn--primary btn--lg"
                                        onClick={() => startApplication()}
                                    >
                                        Apply for a pass
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn--secondary btn--lg"
                                        onClick={() => go("/track")}
                                    >
                                        Track an application
                                    </button>
                                </div>

                                <p className="hero__note">
                                    First time here?{" "}
                                    <button
                                        type="button"
                                        className="linkish"
                                        onClick={() => go("/register")}
                                    >
                                        Create a student profile
                                    </button>
                                </p>
                            </div>

                            <aside className="overview" aria-label="Service overview">
                                <div className="overview__row">
                                    <span className="overview__label">
                                        Routes on offer
                                    </span>
                                    <span className="overview__value">
                                        {routes.length}
                                    </span>
                                </div>
                                <div className="overview__row">
                                    <span className="overview__label">
                                        Pass options
                                    </span>
                                    <span className="overview__value">
                                        {passTypes.length}
                                    </span>
                                </div>
                                <div className="overview__row">
                                    <span className="overview__label">
                                        Lowest fare
                                    </span>
                                    <span className="overview__value">
                                        {routes.length
                                            ? formatMoney(
                                                  Math.min(
                                                      ...routes.map((route) =>
                                                          Number(route.fare),
                                                      ),
                                                  ),
                                              )
                                            : "—"}
                                    </span>
                                </div>

                                <div className="overview__foot">
                                    <span className="overview__badge">
                                        Transport office
                                    </span>
                                    <p>
                                        Applications are reviewed Monday to
                                        Friday, 9:00–17:00.
                                    </p>
                                </div>
                            </aside>
                        </section>

                        <section className="home-section">
                            <div className="section-head">
                                <h2>Routes and fares</h2>
                                <p>Fares are per journey on the campus network.</p>
                            </div>

                            <div className="panel">
                                <div className="table-wrap">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th scope="col">Route</th>
                                                <th scope="col">From</th>
                                                <th scope="col">To</th>
                                                <th scope="col" className="table__cell--end">
                                                    Fare
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {optionsError ? (
                                                <tr>
                                                    <td className="table__empty" colSpan="4">
                                                        {optionsError}{" "}
                                                        <button
                                                            type="button"
                                                            className="linkish"
                                                            onClick={() =>
                                                                setOptionsReloadKey(
                                                                    (key) => key + 1,
                                                                )
                                                            }
                                                        >
                                                            Try again
                                                        </button>
                                                    </td>
                                                </tr>
                                            ) : routes.length === 0 ? (
                                                <tr>
                                                    <td className="table__empty" colSpan="4">
                                                        Routes are being updated.
                                                        Please check back shortly.
                                                    </td>
                                                </tr>
                                            ) : (
                                                routes.map((route) => (
                                                    <tr key={route.route_id}>
                                                        <td className="table__primary">
                                                            {route.route_name}
                                                        </td>
                                                        <td>{route.source}</td>
                                                        <td>{route.destination}</td>
                                                        <td className="table__cell--end mono">
                                                            {formatMoney(route.fare)}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>

                        <section className="home-section">
                            <div className="section-head">
                                <h2>Pass options</h2>
                                <p>Choose the validity that suits your term.</p>
                            </div>

                            <div className="panel">
                                <div className="table-wrap">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th scope="col">Pass type</th>
                                                <th scope="col">Validity</th>
                                                <th scope="col" className="table__cell--end">
                                                    Fee
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {passTypes.length === 0 ? (
                                                <tr>
                                                    <td className="table__empty" colSpan="3">
                                                        Pass options are being
                                                        updated. Please check back
                                                        shortly.
                                                    </td>
                                                </tr>
                                            ) : (
                                                passTypes.map((type) => (
                                                    <tr key={type.pass_type_id}>
                                                        <td className="table__primary">
                                                            {type.type_name}
                                                        </td>
                                                        <td>
                                                            {formatDuration(
                                                                type.duration_months,
                                                            )}
                                                        </td>
                                                        <td className="table__cell--end mono">
                                                            {formatMoney(type.fee)}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>

                        <section className="home-section">
                            <div className="section-head">
                                <h2>Application journey</h2>
                                <p>Three steps from profile to approval.</p>
                            </div>

                            <ol className="journey">
                                <li className="journey__step">
                                    <span className="journey__index">01</span>
                                    <h3>Registration</h3>
                                    <p>
                                        Create a student profile with your name,
                                        email and a password.
                                    </p>
                                </li>
                                <li className="journey__step">
                                    <span className="journey__index">02</span>
                                    <h3>Application</h3>
                                    <p>
                                        Pick a route and pass type, then submit
                                        your application for review.
                                    </p>
                                </li>
                                <li className="journey__step">
                                    <span className="journey__index">03</span>
                                    <h3>Approval</h3>
                                    <p>
                                        The transport office approves or rejects
                                        the request and the status updates.
                                    </p>
                                </li>
                            </ol>
                        </section>

                        <section className="home-section">
                            <div className="section-head">
                                <h2>Campus transport information</h2>
                            </div>

                            <div className="info-grid">
                                <article className="info-card">
                                    <h3>Transport office</h3>
                                    <p>
                                        Administrative Block, ground floor.
                                        Open Monday to Friday, 9:00–17:00.
                                    </p>
                                </article>

                                <article className="info-card">
                                    <h3>Before you travel</h3>
                                    <p>
                                        Apply at least three working days before
                                        your first journey and carry your
                                        student ID on board.
                                    </p>
                                </article>

                                <article className="info-card">
                                    <h3>Application review</h3>
                                    <p>
                                        Keep your application number safe. It is
                                        the reference the office uses to look up
                                        your request.
                                    </p>
                                </article>
                            </div>
                        </section>
                    </>
                )}

                {pathname === "/register" && (
                    <div className="form-layout">
                        <div>
                            <PageHeader
                                eyebrow="Student services"
                                title="Create your student profile"
                                description="Register once, then apply for any campus route. Your profile keeps your applications together."
                            />

                            <aside className="form-aside">
                                <h2>What you need</h2>
                                <ol>
                                    <li>
                                        Your full name as it appears on your
                                        student record.
                                    </li>
                                    <li>
                                        An email address that is not already
                                        registered.
                                    </li>
                                    <li>
                                        A password for future visits to this
                                        portal.
                                    </li>
                                </ol>
                            </aside>
                        </div>

                        <div className="panel">
                            <div className="panel__head">
                                <h2 className="panel__title">
                                    Registration details
                                </h2>
                            </div>

                            <div className="panel__body">
                                {registeredStudent ? (
                                    <div className="stack">
                                        <div className="alert alert--success">
                                            Your student profile has been
                                            created.
                                        </div>

                                        <div className="callout">
                                            <div className="callout__row">
                                                <span className="callout__label">
                                                    Student reference
                                                </span>
                                                <span className="callout__value">
                                                    {registeredStudent.user_id ??
                                                        "—"}
                                                </span>
                                            </div>
                                            <p>
                                                Note this number down. You will
                                                need it when you apply for a
                                                pass.
                                            </p>
                                        </div>

                                        <div className="btn-row">
                                            <button
                                                type="button"
                                                className="btn btn--primary"
                                                onClick={() =>
                                                    startApplication(
                                                        registeredStudent.user_id,
                                                    )
                                                }
                                            >
                                                Continue to application
                                            </button>

                                            <button
                                                type="button"
                                                className="btn btn--secondary"
                                                onClick={() => {
                                                    setRegisteredStudent(null);
                                                    setRegisterError("");
                                                }}
                                            >
                                                Register another student
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <form
                                        onSubmit={registerStudent}
                                        noValidate
                                    >
                                        {registerError && (
                                            <div className="alert alert--error">
                                                {registerError}
                                            </div>
                                        )}

                                        <Field
                                            id="full_name"
                                            label="Full name"
                                            invalid={Boolean(registerError)}
                                        >
                                            <input
                                                id="full_name"
                                                name="full_name"
                                                type="text"
                                                autoComplete="name"
                                                placeholder="e.g. Ananya Sharma"
                                                value={
                                                    registerForm.full_name
                                                }
                                                onChange={(event) =>
                                                    setRegisterForm({
                                                        ...registerForm,
                                                        full_name:
                                                            event.target.value,
                                                    })
                                                }
                                            />
                                        </Field>

                                        <Field
                                            id="email"
                                            label="Email address"
                                            hint="Use an address you can access. It identifies your profile."
                                        >
                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                autoComplete="email"
                                                placeholder="student@campus.edu"
                                                value={registerForm.email}
                                                onChange={(event) =>
                                                    setRegisterForm({
                                                        ...registerForm,
                                                        email: event.target
                                                            .value,
                                                    })
                                                }
                                            />
                                        </Field>

                                        <Field id="password" label="Password">
                                            <input
                                                id="password"
                                                name="password"
                                                type="password"
                                                autoComplete="new-password"
                                                placeholder="Choose a password"
                                                value={registerForm.password}
                                                onChange={(event) =>
                                                    setRegisterForm({
                                                        ...registerForm,
                                                        password:
                                                            event.target.value,
                                                    })
                                                }
                                            />
                                        </Field>

                                        <button
                                            type="submit"
                                            className="btn btn--primary btn--block"
                                            disabled={registering}
                                        >
                                            {registering
                                                ? "Creating profile…"
                                                : "Create student profile"}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {pathname === "/apply" && (
                    <div className="form-layout">
                        <div>
                            <PageHeader
                                eyebrow="Bus pass application"
                                title="Apply for your bus pass"
                                description="Select your route and how long you need the pass. The transport office will review your request."
                            />

                            <aside className="form-aside">
                                <h2>Before you submit</h2>
                                <ol>
                                    <li>
                                        Have your student reference number
                                        ready.
                                    </li>
                                    <li>
                                        Choose one route and one pass validity.
                                    </li>
                                    <li>
                                        Keep the application number you receive.
                                    </li>
                                </ol>
                            </aside>
                        </div>

                        <div className="panel">
                            <div className="panel__head">
                                <h2 className="panel__title">
                                    Application details
                                </h2>
                                <span className="panel__meta">
                                    Reviewed by the transport office
                                </span>
                            </div>

                            <div className="panel__body">
                                {submitted ? (
                                    <>
                                        <div className="alert alert--success">
                                            Your application has been submitted
                                            for review.
                                        </div>

                                        <div className="status-result">
                                            <ApplicationResult
                                                application={submitted}
                                                actions={
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="btn btn--primary"
                                                            onClick={() =>
                                                                trackApplication(
                                                                    submitted.application_code,
                                                                )
                                                            }
                                                        >
                                                            Track this application
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="btn btn--secondary"
                                                            onClick={() =>
                                                                startApplication()
                                                            }
                                                        >
                                                            Submit another
                                                            application
                                                        </button>
                                                    </>
                                                }
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <form
                                        onSubmit={submitApplication}
                                        noValidate
                                    >
                                        {applyError && (
                                            <div className="alert alert--error">
                                                {applyError}
                                            </div>
                                        )}

                                        <Field
                                            id="student_id"
                                            label="Student reference number"
                                            hint="The number shown when you registered."
                                            invalid={Boolean(applyError)}
                                        >
                                            <input
                                                id="student_id"
                                                name="student_id"
                                                type="number"
                                                inputMode="numeric"
                                                min="1"
                                                step="1"
                                                placeholder="e.g. 12"
                                                value={applyForm.student_id}
                                                onChange={(event) =>
                                                    setApplyForm({
                                                        ...applyForm,
                                                        student_id:
                                                            event.target.value,
                                                    })
                                                }
                                            />
                                        </Field>

                                        <Field id="route_id" label="Route">
                                            <select
                                                id="route_id"
                                                name="route_id"
                                                value={applyForm.route_id}
                                                onChange={(event) =>
                                                    setApplyForm({
                                                        ...applyForm,
                                                        route_id:
                                                            event.target.value,
                                                    })
                                                }
                                            >
                                                <option value="">
                                                    Select a route
                                                </option>
                                                {routes.map((route) => (
                                                    <option
                                                        key={route.route_id}
                                                        value={route.route_id}
                                                    >
                                                        {route.source} →{" "}
                                                        {route.destination} ·{" "}
                                                        {formatMoney(route.fare)}
                                                    </option>
                                                ))}
                                            </select>
                                        </Field>

                                        <Field
                                            id="pass_type_id"
                                            label="Pass type"
                                        >
                                            <select
                                                id="pass_type_id"
                                                name="pass_type_id"
                                                value={applyForm.pass_type_id}
                                                onChange={(event) =>
                                                    setApplyForm({
                                                        ...applyForm,
                                                        pass_type_id:
                                                            event.target.value,
                                                    })
                                                }
                                            >
                                                <option value="">
                                                    Select a pass type
                                                </option>
                                                {passTypes.map((type) => (
                                                    <option
                                                        key={type.pass_type_id}
                                                        value={type.pass_type_id}
                                                    >
                                                        {type.type_name} ·{" "}
                                                        {formatDuration(
                                                            type.duration_months,
                                                        )}{" "}
                                                        · {formatMoney(type.fee)}
                                                    </option>
                                                ))}
                                            </select>
                                        </Field>

                                        <button
                                            type="submit"
                                            className="btn btn--primary btn--block"
                                            disabled={applying}
                                        >
                                            {applying
                                                ? "Submitting…"
                                                : "Submit application"}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {pathname === "/track" && (
                    <div className="form-layout">
                        <div>
                            <PageHeader
                                eyebrow="Application tracking"
                                title="Track your bus pass"
                                description="Look up an application with the number you received. The current status is shown as soon as it is reviewed."
                            />

                            <aside className="form-aside">
                                <h2>Finding your application</h2>
                                <ol>
                                    <li>
                                        Use the application number from your
                                        confirmation screen.
                                    </li>
                                    <li>
                                        Numbers look like APP-00001. A plain
                                        number also works.
                                    </li>
                                    <li>
                                        Pending applications have not been
                                        reviewed yet.
                                    </li>
                                </ol>
                            </aside>
                        </div>

                        <div className="panel">
                            <div className="panel__head">
                                <h2 className="panel__title">
                                    Application status
                                </h2>
                            </div>

                            <div className="panel__body">
                                <form
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        lookupApplication();
                                    }}
                                    noValidate
                                >
                                    <Field
                                        id="application_reference"
                                        label="Application number"
                                        hint="Example: APP-00001."
                                        invalid={Boolean(statusError)}
                                    >
                                        <input
                                            id="application_reference"
                                            name="application_reference"
                                            type="text"
                                            autoComplete="off"
                                            placeholder="APP-00001"
                                            value={statusQuery}
                                            onChange={(event) =>
                                                setStatusQuery(
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </Field>

                                    {statusError && (
                                        <div className="alert alert--error">
                                            {statusError}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="btn btn--primary btn--block"
                                        disabled={statusLoading}
                                    >
                                        {statusLoading
                                            ? "Checking…"
                                            : "Check status"}
                                    </button>
                                </form>

                                {statusResult && (
                                    <div className="status-result">
                                        <ApplicationResult
                                            application={statusResult}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <footer className="site-footer">
                <div className="site-footer__inner">
                    <div className="site-footer__brand">
                        <Brand subtitle="Bus Pass Management" />
                        <p>
                            Campus transport services for students and staff.
                        </p>
                    </div>

                    <nav className="site-footer__links" aria-label="Footer">
                        <button
                            type="button"
                            onClick={() => go("/register")}
                        >
                            Register
                        </button>
                        <button type="button" onClick={() => go("/apply")}>
                            Apply for a pass
                        </button>
                        <button type="button" onClick={() => go("/track")}>
                            Track an application
                        </button>
                    </nav>

                    <div className="site-footer__office">
                        <span className="site-footer__heading">
                            Transport office
                        </span>
                        <p>Administrative Block, ground floor</p>
                        <p>Monday–Friday, 9:00–17:00</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
