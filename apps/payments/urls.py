from django.urls import path
from . import views

urlpatterns = [
    # Customer endpoints
    path("pay/",
         views.InitiatePaymentView.as_view(),
         name="initiate_payment"),

    path("my-payments/",
         views.MyPaymentsView.as_view(),
         name="my_payments"),

    path("<int:pk>/",
         views.PaymentDetailView.as_view(),
         name="payment_detail"),

    # Admin endpoints
    path("admin/all/",
         views.AdminPaymentListView.as_view(),
         name="admin_payment_list"),

    path("admin/<int:pk>/refund/",
         views.AdminRefundView.as_view(),
         name="admin_refund"),
]