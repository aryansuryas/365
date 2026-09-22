export function AvatarBadge({ initials, href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-primary/10 text-xs font-semibold text-primary transition hover:border-primary/40 hover:bg-primary/15"
    >
      {initials}
    </a>
  )
}
