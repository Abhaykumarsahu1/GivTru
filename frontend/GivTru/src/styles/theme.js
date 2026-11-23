// Token references for inline styles. Values live in theme.css as CSS variables,
// so changing the look later means editing one file.
// For anything that needs hover/media queries, use the .gt-* classes in theme.css instead.

export const c = {
    bg: "var(--bg)",
    surface: "var(--surface)",
    surfaceAlt: "var(--surface-alt)",
    border: "var(--border)",
    borderStrong: "var(--border-strong)",
    text: "var(--text)",
    muted: "var(--text-muted)",
    dim: "var(--text-dim)",
    primary: "var(--primary)",
    primaryInk: "var(--primary-ink)",
    onPrimary: "var(--on-primary)",
    warning: "var(--warning)",
    danger: "var(--danger)",
    info: "var(--info)",
};

export const r = {
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    xl: "var(--radius-xl)",
};

export const font = {
    sans: "var(--font-sans)",
    mono: "var(--font-mono)",
};

// Spacing scale (px)
export const sp = { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 };

// Status -> badge class + label, shared by cards, detail page, dashboards
export const STATUS_BADGE = {
    active:   { className: "gt-badge gt-badge-success", label: "Active" },
    funded:   { className: "gt-badge gt-badge-success", label: "Goal reached" },
    expired:  { className: "gt-badge gt-badge-warning", label: "Ended" },
    failed:   { className: "gt-badge gt-badge-danger",  label: "Goal missed" },
};