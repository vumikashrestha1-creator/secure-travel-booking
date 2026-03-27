# payments/urls.py

from django.urls import path
from .views import (
    MockPaymentView,
    MyPaymentsView,
    AllPaymentsView,
    PaymentDetailView,
)

urlpatterns = [
    path('mock-pay/',     MockPaymentView.as_view(),   name='mock-payment'),
    path('my-payments/',  MyPaymentsView.as_view(),    name='my-payments'),
    path('all/',          AllPaymentsView.as_view(),   name='all-payments'),
    path('<int:pk>/',     PaymentDetailView.as_view(), name='payment-detail'),
]
