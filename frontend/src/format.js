const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];

export function formatDateTime(value) {
    if (!value) {
        return "—";
    }

    const match = String(value).match(
        /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/,
    );

    if (!match) {
        return String(value);
    }

    const [, year, month, day, hours, minutes] = match;
    const monthName = MONTHS[Number(month) - 1] || month;

    return `${day} ${monthName} ${year}, ${hours}:${minutes}`;
}

export function formatDate(value) {
    const formatted = formatDateTime(value);

    return formatted === "—" ? formatted : formatted.split(",")[0];
}

export function formatMoney(value) {
    const amount = Number(value);

    if (Number.isNaN(amount)) {
        return `₹${value}`;
    }

    return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatDuration(value) {
    const months = Number(value);

    return `${months} month${months === 1 ? "" : "s"}`;
}

export function initials(name) {
    const parts = String(name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) {
        return "A";
    }

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
