import json
import logging

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware:
    """
    Adds security headers to every response automatically.

    What each header does:
    - X-Content-Type-Options: Stops browsers from guessing
      file types (prevents MIME sniffing attacks)
    - X-Frame-Options: Stops your site being embedded in
      another site's iframe (prevents clickjacking)
    - X-XSS-Protection: Tells older browsers to block
      reflected XSS attacks
    - Referrer-Policy: Controls what URL info is shared
      when clicking links (privacy protection)
    - Permissions-Policy: Disables browser features your
      site does not need (camera, microphone, location)
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Add security headers to every single response
        response["X-Content-Type-Options"] = "nosniff"
        response["X-Frame-Options"]        = "DENY"
        response["X-XSS-Protection"]       = "1; mode=block"
        response["Referrer-Policy"]        = "strict-origin-when-cross-origin"
        response["Permissions-Policy"]     = (
            "geolocation=(), microphone=(), camera=()"
        )

        return response


class RequestLoggingMiddleware:
    """
    Logs every API request to the console for debugging.

    What this does:
    - Records every request method, path, and status code
    - Helps you see what is happening in your system
    - Very useful for debugging during development
    - In production this would write to a log file
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Log every API request
        if request.path.startswith("/api/"):
            logger.info(
                f"{request.method} {request.path} "
                f"→ {response.status_code}"
            )

        return response