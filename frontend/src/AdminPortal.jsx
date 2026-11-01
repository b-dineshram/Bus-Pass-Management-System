import { useEffect, useState } from "react";
import { adminApi } from "./api";
import { Brand, ConfirmDialog, StatTile, StatusPill } from "./components";
import { formatDateTime, initials } from "./format";

const VIEWS = [
    ["overview", "Overview"],
    ["applications", "Applications"],
    ["students", "Students"],
];

const STATUS_OPTIONS = [
    ["ALL", "All statuses"],
    ["PENDING", "Pending"],
    ["APPROVED", "Approved"],
    ["REJECTED", "Rejected"],
];

export default function AdminPortal({
    admin,
    onSignOut,
    onSessionExpired,
    onOpenStudentPortal,
}) {
    const [view, setView] = useState("overview");
    const [students, setStudents] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);

    const [applicationQuery, setApplicationQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [studentQuery, setStudentQuery] = useState("");

    const [decision, setDecision] = useState(null);
    const [deciding, setDeciding] = useState(false);
    const [actionError, setActionError] = useState("");
    const [signingOut, setSigningOut] = useState(false);

    useEffect(() => {
        let active = true;

        Promise.all([adminApi.students(), adminApi.applications()])
            .then(([studentRows, applicationRows]) => {
                if (!active) return;
                setStudents(studentRows);
                setApplications(applicationRows);
                setLoadError("");
            })
            .catch((error) => {
                if (!active) return;

                if (error.status === 401) {
                    onSessionExpired();
                    return;
                }

                setLoadError(error.message);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [reloadKey, onSessionExpired]);

    const refresh = () => {
        setLoading(true);
        setLoadError("");
        setReloadKey((key) => key + 1);
    };

    const confirmDecision = async () => {
        if (!decision) return;

        setDeciding(true);
        setActionError("");

        try {
            await adminApi.decide(
                decision.application.application_id,
                decision.status,
            );
            setDecision(null);
            setLoading(true);
            setReloadKey((key) => key + 1);
        } catch (error) {
            if (error.status === 401) {
                onSessionExpired();
                return;
            }

            setDecision(null);
            setActionError(error.message);
        } finally {
            setDeciding(false);
        }
    };

    const signOut = async () => {
        setSigningOut(true);

        try {
            await onSignOut();
        } finally {
            setSigningOut(false);
        }
    };

    const counts = applications.reduce(
        (totals, application) => {
            const key = String(application.status || "").toUpperCase();

            if (key in totals) totals[key] += 1;

            return totals;
        },
        { PENDING: 0, APPROVED: 0, REJECTED: 0 },
    );

    const applicationTotal = applications.length;
    const studentTotal = students.filter(
        (student) => String(student.role).toUpperCase() === "STUDENT",
    ).length;

    const applicationQueryValue = applicationQuery.trim().toLowerCase();

    const visibleApplications = applications.filter((application) => {
        const matchesStatus =
            statusFilter === "ALL" ||
            String(application.status).toUpperCase() === statusFilter;

        if (!matchesStatus) return false;
        if (!applicationQueryValue) return true;

        return [
            application.application_code,
            application.student_name,
            application.student_email,
            application.route_name,
            application.source,
            application.destination,
            application.type_name,
        ].some((value) =>
            String(value || "")
                .toLowerCase()
                .includes(applicationQueryValue),
        );
    });

    const studentQueryValue = studentQuery.trim().toLowerCase();

    const visibleStudents = students.filter((student) => {
        if (!studentQueryValue) return true;

        return [
            student.user_id,
            student.full_name,
            student.email,
            student.role,
        ].some((value) =>
            String(value || "").toLowerCase().includes(studentQueryValue),
        );
    });

    const applicationsFor = (userId) =>
        applications.filter(
            (application) => application.user_id === userId,
        ).length;

    const recentApplications = applications.slice(0, 5);

    const viewTitle =
        view === "applications"
            ? "Applications"
            : view === "students"
              ? "Students"
              : "Overview";

    const viewSubtitle =
        view === "applications"
            ? "Review and decide on submitted pass applications."
            : view === "students"
              ? "Registered accounts and their application activity."
              : "A summary of student records and application decisions.";

    const countFor = (key) => counts[key] ?? 0;

    const reviewPending = () => {
        setView("applications");
        setStatusFilter("PENDING");
        setApplicationQuery("");
    };

    return (
        <div className="admin-shell">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <Brand subtitle="Administration" onDark />

                <nav className="admin-nav" aria-label="Administration">
                    {VIEWS.map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            className={
                                view === key
                                    ? "admin-nav__link is-active"
                                    : "admin-nav__link"
                            }
                            aria-current={view === key ? "page" : undefined}
                            onClick={() => setView(key)}
                        >
                            <span>{label}</span>
                            {key === "applications" &&
                                countFor("PENDING") > 0 && (
                                    <span className="admin-nav__count">
                                        {countFor("PENDING")}
                                    </span>
                                )}
                            {key === "students" && (
                                <span className="admin-nav__meta">
                                    {students.length}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="admin-sidebar__foot">
                    <button
                        type="button"
                        className="admin-sidebar__link"
                        onClick={onOpenStudentPortal}
                    >
                        Open student portal
                    </button>
                </div>
            </aside>

            {/* Main column */}
            <div className="admin-main">
                <header className="admin-header">
                    <div className="admin-header__title">
                        <h1>{viewTitle}</h1>
                        <p>{viewSubtitle}</p>
                    </div>

                    <div className="admin-header__account">
                        <span className="avatar" aria-hidden="true">
                            {initials(admin.full_name)}
                        </span>

                        <span className="admin-header__identity">
                            <strong>{admin.full_name}</strong>
                            <span>{admin.email}</span>
                        </span>

                        <button
                            type="button"
                            className="btn btn--secondary btn--sm"
                            onClick={signOut}
                            disabled={signingOut}
                        >
                            {signingOut ? "Signing out…" : "Sign out"}
                        </button>
                    </div>
                </header>

                <main className="admin-content">
                    {loadError && (
                        <div className="alert alert--error">
                            {loadError}{" "}
                            <button
                                type="button"
                                className="linkish"
                                onClick={refresh}
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {actionError && (
                        <div className="alert alert--error" role="alert">
                            {actionError}
                        </div>
                    )}

                    {/* Overview */}
                    {view === "overview" && (
                        <>
                            <section className="stats" aria-label="Summary">
                                <StatTile
                                    label="Students"
                                    value={studentTotal}
                                    meta={`${students.length} accounts`}
                                />
                                <StatTile
                                    label="Applications"
                                    value={applicationTotal}
                                    meta="All time"
                                />
                                <StatTile
                                    label="Pending"
                                    value={countFor("PENDING")}
                                    tone="pending"
                                    meta="Awaiting review"
                                />
                                <StatTile
                                    label="Approved"
                                    value={countFor("APPROVED")}
                                    tone="approved"
                                    meta="Passes issued"
                                />
                                <StatTile
                                    label="Rejected"
                                    value={countFor("REJECTED")}
                                    tone="rejected"
                                    meta="Declined requests"
                                />
                            </section>

                            <section className="admin-grid">
                                <div className="panel">
                                    <div className="panel__head">
                                        <div>
                                            <h2 className="panel__title">
                                                Needs review
                                            </h2>
                                            <p className="panel__description">
                                                Applications waiting for a
                                                decision.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="panel__body">
                                        {loading &&
                                        applications.length === 0 ? (
                                            <p className="muted">
                                                Loading applications…
                                            </p>
                                        ) : countFor("PENDING") > 0 ? (
                                            <>
                                                <span className="focus-figure">
                                                    {countFor("PENDING")}
                                                </span>
                                                <p className="focus-copy">
                                                    {countFor("PENDING") ===
                                                    1
                                                        ? "application is waiting for review."
                                                        : "applications are waiting for review."}
                                                </p>
                                                <button
                                                    type="button"
                                                    className="btn btn--primary"
                                                    onClick={reviewPending}
                                                >
                                                    Review applications
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <span className="focus-figure">
                                                    0
                                                </span>
                                                <p className="focus-copy">
                                                    No applications are waiting
                                                    for review.
                                                </p>
                                                <button
                                                    type="button"
                                                    className="btn btn--secondary"
                                                    onClick={() =>
                                                        setView("applications")
                                                    }
                                                >
                                                    View all applications
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="panel">
                                    <div className="panel__head">
                                        <div>
                                            <h2 className="panel__title">
                                                Recent applications
                                            </h2>
                                            <p className="panel__description">
                                                The five most recent
                                                submissions.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            className="btn btn--secondary btn--sm"
                                            onClick={refresh}
                                            disabled={loading}
                                        >
                                            {loading ? "Refreshing…" : "Refresh"}
                                        </button>
                                    </div>

                                    <div className="table-wrap">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th scope="col">
                                                        Application
                                                    </th>
                                                    <th scope="col">Student</th>
                                                    <th scope="col">Status</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {recentApplications.length ===
                                                0 ? (
                                                    <tr>
                                                        <td
                                                            className="table__empty"
                                                            colSpan="3"
                                                        >
                                                            {loading
                                                                ? "Loading applications…"
                                                                : "No applications have been submitted yet."}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    recentApplications.map(
                                                        (application) => (
                                                            <tr
                                                                key={
                                                                    application.application_id
                                                                }
                                                            >
                                                                <td
                                                                    className="table__primary"
                                                                >
                                                                    <span className="mono">
                                                                        {
                                                                            application.application_code
                                                                        }
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <span className="table__primary">
                                                                        {
                                                                            application.student_name
                                                                        }
                                                                    </span>
                                                                    <span className="table__sub">
                                                                        {
                                                                            application.type_name
                                                                        }{" "}
                                                                        ·{" "}
                                                                        {
                                                                            application.source
                                                                        }{" "}
                                                                        →{" "}
                                                                        {
                                                                            application.destination
                                                                        }
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <StatusPill
                                                                        status={
                                                                            application.status
                                                                        }
                                                                    />
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}

                    {/* Applications */}
                    {view === "applications" && (
                        <section className="panel">
                            <div className="panel__head panel__head--stack">
                                <div>
                                    <h2 className="panel__title">
                                        Pass applications
                                    </h2>
                                    <p className="panel__description">
                                        {visibleApplications.length} of{" "}
                                        {applications.length} applications
                                    </p>
                                </div>

                                <div className="toolbar">
                                    <div className="search">
                                        <label
                                            className="search__label"
                                            htmlFor="application-search"
                                        >
                                            Search applications
                                        </label>
                                        <input
                                            id="application-search"
                                            type="search"
                                            placeholder="Number, student, route…"
                                            value={applicationQuery}
                                            onChange={(event) =>
                                                setApplicationQuery(
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="filter">
                                        <label
                                            className="search__label"
                                            htmlFor="status-filter"
                                        >
                                            Status
                                        </label>
                                        <select
                                            id="status-filter"
                                            value={statusFilter}
                                            onChange={(event) =>
                                                setStatusFilter(
                                                    event.target.value,
                                                )
                                            }
                                        >
                                            {STATUS_OPTIONS.map(
                                                ([value, label]) => (
                                                    <option
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {label}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </div>

                                    <button
                                        type="button"
                                        className="btn btn--secondary btn--sm"
                                        onClick={refresh}
                                        disabled={loading}
                                    >
                                        {loading ? "Refreshing…" : "Refresh"}
                                    </button>
                                </div>
                            </div>

                            <div className="table-wrap">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th scope="col">Application</th>
                                            <th scope="col">Student</th>
                                            <th scope="col">Route</th>
                                            <th scope="col">Pass type</th>
                                            <th scope="col">Submitted</th>
                                            <th scope="col">Status</th>
                                            <th scope="col" className="table__cell--end">
                                                Decision
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className={loading ? "is-busy" : undefined}>
                                        {visibleApplications.length === 0 ? (
                                            <tr>
                                                <td
                                                    className="table__empty"
                                                    colSpan="7"
                                                >
                                                    {loading
                                                        ? "Loading applications…"
                                                        : applications.length ===
                                                          0
                                                          ? "No applications have been submitted yet."
                                                          : "No applications match this search or status."}
                                                </td>
                                            </tr>
                                        ) : (
                                            visibleApplications.map(
                                                (application) => (
                                                    <tr
                                                        key={
                                                            application.application_id
                                                        }
                                                    >
                                                        <td
                                                            className="table__primary"
                                                        >
                                                            <span className="mono">
                                                                {
                                                                    application.application_code
                                                                }
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="table__primary">
                                                                {
                                                                    application.student_name
                                                                }
                                                            </span>
                                                            <span className="table__sub">
                                                                {
                                                                    application.student_email
                                                                }
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {application.source}{" "}
                                                            →{" "}
                                                            {
                                                                application.destination
                                                            }
                                                            <span className="table__sub">
                                                                {
                                                                    application.route_name
                                                                }
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {
                                                                application.type_name
                                                            }
                                                        </td>
                                                        <td>
                                                            {formatDateTime(
                                                                application.applied_at,
                                                            )}
                                                        </td>
                                                        <td>
                                                            <StatusPill
                                                                status={
                                                                    application.status
                                                                }
                                                            />
                                                        </td>
                                                        <td className="table__cell--end">
                                                            <div className="table__actions">
                                                                <button
                                                                    type="button"
                                                                    className="btn btn--primary btn--sm"
                                                                    onClick={() =>
                                                                        setDecision({
                                                                            application,
                                                                            status: "APPROVED",
                                                                        })
                                                                    }
                                                                    disabled={
                                                                        String(
                                                                            application.status,
                                                                        ).toUpperCase() ===
                                                                        "APPROVED"
                                                                    }
                                                                >
                                                                    Approve
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="btn btn--secondary btn--sm btn--quiet-danger"
                                                                    onClick={() =>
                                                                        setDecision({
                                                                            application,
                                                                            status: "REJECTED",
                                                                        })
                                                                    }
                                                                    disabled={
                                                                        String(
                                                                            application.status,
                                                                        ).toUpperCase() ===
                                                                        "REJECTED"
                                                                    }
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ),
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* Students */}
                    {view === "students" && (
                        <section className="panel">
                            <div className="panel__head panel__head--stack">
                                <div>
                                    <h2 className="panel__title">
                                        Student records
                                    </h2>
                                    <p className="panel__description">
                                        {visibleStudents.length} of{" "}
                                        {students.length} accounts
                                    </p>
                                </div>

                                <div className="toolbar">
                                    <div className="search">
                                        <label
                                            className="search__label"
                                            htmlFor="student-search"
                                        >
                                            Search students
                                        </label>
                                        <input
                                            id="student-search"
                                            type="search"
                                            placeholder="Number, name, email…"
                                            value={studentQuery}
                                            onChange={(event) =>
                                                setStudentQuery(
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        className="btn btn--secondary btn--sm"
                                        onClick={refresh}
                                        disabled={loading}
                                    >
                                        {loading ? "Refreshing…" : "Refresh"}
                                    </button>
                                </div>
                            </div>

                            <div className="table-wrap">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th scope="col">Reference</th>
                                            <th scope="col">Student</th>
                                            <th scope="col">Email</th>
                                            <th scope="col">Role</th>
                                            <th scope="col" className="table__cell--end">
                                                Applications
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className={loading ? "is-busy" : undefined}>
                                        {visibleStudents.length === 0 ? (
                                            <tr>
                                                <td
                                                    className="table__empty"
                                                    colSpan="5"
                                                >
                                                    {loading
                                                        ? "Loading student records…"
                                                        : "No student records match this search."}
                                                </td>
                                            </tr>
                                        ) : (
                                            visibleStudents.map((student) => (
                                                <tr key={student.user_id}>
                                                    <td className="table__primary">
                                                        <span className="mono">
                                                            #{student.user_id}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="table__primary">
                                                            {student.full_name}
                                                        </span>
                                                    </td>
                                                    <td>{student.email}</td>
                                                    <td>
                                                        <span className="tag">
                                                            {String(
                                                                student.role,
                                                            ).toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="table__cell--end mono">
                                                        {applicationsFor(
                                                            student.user_id,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </main>
            </div>

            {decision && (
                <ConfirmDialog
                    title={
                        decision.status === "APPROVED"
                            ? "Approve this application?"
                            : "Reject this application?"
                    }
                    description={`${decision.application.application_code} for ${decision.application.student_name}, ${decision.application.source} → ${decision.application.destination}. The student will see the updated status immediately.`}
                    confirmLabel={
                        decision.status === "APPROVED"
                            ? "Approve application"
                            : "Reject application"
                    }
                    tone={decision.status === "APPROVED" ? "primary" : "danger"}
                    busy={deciding}
                    onCancel={() => setDecision(null)}
                    onConfirm={confirmDecision}
                />
            )}
        </div>
    );
}
