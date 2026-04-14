from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from apps.listings.ai_views import AIRecommendationsView, AIChatView

urlpatterns = [
    path("admin/",            admin.site.urls),
    path("api/users/",        include("apps.users.urls")),
    path("api/listings/",     include("apps.listings.urls")),
    path("api/bookings/",     include("apps.bookings.urls")),
    path("api/payments/",     include("apps.payments.urls")),
    path("api/reviews/",      include("apps.reviews.urls")),
    path("api/ai/recommend/", AIRecommendationsView.as_view()),
    path("api/ai/chat/",      AIChatView.as_view()),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )