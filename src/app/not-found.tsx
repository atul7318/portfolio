import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--dark)",
        color: "var(--foreground)",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(6rem, 15vw, 14rem)",
          letterSpacing: "0.05em",
          background: "linear-gradient(135deg, var(--azure), var(--electric), var(--neon))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          lineHeight: 1,
          margin: 0,
        }}
      >
        404
      </h1>
      <p
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "0.75rem",
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "rgba(240,240,240,0.4)",
          marginTop: "1rem",
        }}
      >
        Page not found
      </p>
      <p
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "1rem",
          color: "rgba(240,240,240,0.6)",
          marginTop: "1.5rem",
          maxWidth: "400px",
        }}
      >
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        style={{
          marginTop: "2.5rem",
          padding: "0.8rem 2rem",
          background: "linear-gradient(135deg, var(--azure), var(--neon))",
          color: "white",
          fontFamily: "'Space Mono', monospace",
          fontSize: "0.72rem",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          textDecoration: "none",
          clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
          transition: "box-shadow 0.3s, transform 0.3s",
        }}
      >
        ← Back Home
      </Link>
    </div>
  );
}
