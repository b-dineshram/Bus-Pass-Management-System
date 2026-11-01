import { formatDateTime, formatDuration, formatMoney } from "./format";

export function Brand({ subtitle = "Bus Pass Management", onDark = false, onClick }) {
    const Tag = onClick ? "button" : "div";

    return (
        <Tag
            type={onClick ? "button" : undefined}
            className={onDark ? "brand brand--on-dark" : "brand"}
            onClick={onClick}
        >
            <span className="brand__mark" aria-hidden="true">
                CT
            </span>
            <span className="brand__text">
                <strong>Campus Transport</strong>
                <span>{subtitle}</span>
            </span>
        </Tag>
    );
}

export function PageHeader({ eyebrow, title, description }) {
    return (
        <header className="page-header">
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h1>{title}</h1>
            {description && <p>{description}</p>}
        </header>
    );
}

export function Field({ id, label, hint, invalid, children }) {
    return (
        <div className={invalid ? "field is-invalid" : "field"}>
            <label className="field__label" htmlFor={id}>
                {label}
            </label>
            {children}
            {hint && <p className="field__hint">{hint}</p>}
        </div>
    );
}

export function StatusPill({ status }) {
    const value = String(status || "UNKNOWN").toUpperCase();

    const tone =
        value === "APPROVED"
            ? "approved"
            : value === "REJECTED"
              ? "rejected"
              : value === "PENDING"
                ? "pending"
                : "neutral";

    return <span className={`pill pill--${tone}`}>{value}</span>;
}

export function StatTile({ label, value, tone, meta }) {
    return (
        <div className={tone ? `stat stat--${tone}` : "stat"}>
            <span className="stat__label">{label}</span>
            <span className="stat__value">{value}</span>
            {meta && <span className="stat__meta">{meta}</span>}
        </div>
    );
}

export function ApplicationResult({ application, actions }) {
    return (
        <div className="result">
            <div className="result__head">
                <div>
                    <span className="result__label">Application number</span>
                    <span className="result__code">
                        {application.application_code}
                    </span>
                </div>
                <StatusPill status={application.status} />
            </div>

            <dl className="detail-grid">
                <div>
                    <dt>Student</dt>
                    <dd>
                        {application.student_name}
                        <span className="table__sub">
                            {application.student_email}
                        </span>
                    </dd>
                </div>
                <div>
                    <dt>Route</dt>
                    <dd>
                        {application.source} → {application.destination}
                        <span className="table__sub">
                            {application.route_name}
                        </span>
                    </dd>
                </div>
                <div>
                    <dt>Pass type</dt>
                    <dd>
                        {application.type_name}
                        <span className="table__sub">
                            {formatDuration(application.duration_months)} ·{" "}
                            {formatMoney(application.fee)}
                        </span>
                    </dd>
                </div>
                <div>
                    <dt>Submitted</dt>
                    <dd>{formatDateTime(application.applied_at)}</dd>
                </div>
            </dl>

            {actions && <div className="result__actions">{actions}</div>}
        </div>
    );
}

export function ConfirmDialog({
    title,
    description,
    confirmLabel,
    tone = "primary",
    busy = false,
    onCancel,
    onConfirm,
}) {
    return (
        <div className="dialog-backdrop" role="presentation">
            <div
                className="dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="dialog-title"
            >
                <h2 id="dialog-title" className="dialog__title">
                    {title}
                </h2>
                <p className="dialog__description">{description}</p>

                <div className="dialog__actions">
                    <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={onCancel}
                        disabled={busy}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className={
                            tone === "danger"
                                ? "btn btn--danger"
                                : "btn btn--primary"
                        }
                        onClick={onConfirm}
                        disabled={busy}
                    >
                        {busy ? "Saving…" : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
