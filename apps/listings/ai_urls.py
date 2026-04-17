from django.urls import path
from .ai_views import SmartAISearchView, AIRecommendationsView, AIChatView

urlpatterns = [
    path("search/",    SmartAISearchView.as_view(),     name="ai_smart_search"),
    path("recommend/", AIRecommendationsView.as_view(), name="ai_recommend"),
    path("chat/",      AIChatView.as_view(),             name="ai_chat"),
]