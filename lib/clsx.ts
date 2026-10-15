/** Join truthy class names - a dependency-free stand-in for clsx. */
export default function clsx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
