'use client'

/**
 * Root error boundary. Renders outside the [locale] tree, so no request
 * config or message provider is guaranteed here — the copy is resolved
 * from the visitor's browser language as a last-resort bilingual fallback.
 */
export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  const isArabic =
    typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("ar");

  return (
    <html lang={isArabic ? "ar" : "en"} dir={isArabic ? "rtl" : "ltr"}>
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#141b2e", color: "#f3efe2", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem" }}>
            {isArabic ? "حدث خطأ ما" : "Something went wrong!"}
          </h2>
          <p style={{ margin: "0 0 1.25rem", opacity: 0.8 }}>
            {isArabic
              ? "حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى."
              : "An unexpected error occurred. Please try again."}
          </p>
          <button
            onClick={() => unstable_retry()}
            style={{
              background: "#e0614a",
              color: "#fffdf8",
              border: "none",
              borderRadius: 8,
              padding: "0.5rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isArabic ? "إعادة المحاولة" : "Try again"}
          </button>
        </div>
      </body>
    </html>
  )
}