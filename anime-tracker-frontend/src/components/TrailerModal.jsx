import { useEffect, useRef } from "react";
import "./TrailerModal.css";

function TrailerModal({ embedUrl, onClose }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const getEmbedUrl = (url) => {
    if (!url) return "";

    let videoId = "";

    // 1. Direct 11-character YouTube Video ID check (common with Jikan API responses)
    if (typeof url === "string" && /^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
      videoId = url.trim();
    } else {
      // 2. Standard URL Parsing (youtube.com/watch?v=, youtu.be/, embed/, etc.)
      const regExp =
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);

      if (match && match[2].length === 11) {
        videoId = match[2];
      }
    }

    if (videoId) {
      const currentOrigin =
        typeof window !== "undefined" ? window.location.origin : "";
      return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(
        currentOrigin
      )}`;
    }

    // Fallback if it's already a complete embed URL
    return url;
  };

  const formattedUrl = getEmbedUrl(embedUrl);

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div className="modal-content">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✖
        </button>
        {formattedUrl ? (
          <iframe
            src={formattedUrl}
            title="Trailer Preview"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="trailer-iframe"
          />
        ) : (
          <div className="no-trailer">Trailer unavailable</div>
        )}
      </div>
    </div>
  );
}

export default TrailerModal;