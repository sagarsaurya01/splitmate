// Deterministic colour per name, Splitwise-style initial avatar.
const COLORS = ["#17a67b", "#e2603c", "#3b82c4", "#9b6bd6", "#d6a21a", "#d6568a"];
export default function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const bg = COLORS[h % COLORS.length];
  return (
    <span className="avatar" style={{ width: size, height: size, background: bg, fontSize: size * 0.42 }}>
      {initial}
    </span>
  );
}
