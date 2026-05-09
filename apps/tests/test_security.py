from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User


class SecurityAccessControlTests(TestCase):
    """
    Tests that prove role-based access control is working correctly.
    Each test confirms that users cannot access endpoints they are not allowed to.
    """

    def setUp(self):
        """Create test users with different roles before each test."""
        self.client = APIClient()

        # Create a Customer user
        self.customer = User.objects.create_user(
            email="customer@test.com",
            password="TestPass123!",
            first_name="Test",
            last_name="Customer",
            role="CUSTOMER"
        )

        # Create a Manager user
        self.manager = User.objects.create_user(
            email="manager@test.com",
            password="TestPass123!",
            first_name="Test",
            last_name="Manager",
            role="MANAGER"
        )

        # Create a Travel Agent user
        self.agent = User.objects.create_user(
            email="agent@test.com",
            password="TestPass123!",
            first_name="Test",
            last_name="Agent",
            role="TRAVEL_AGENT"
        )

        # Create an Admin user
        self.admin = User.objects.create_user(
            email="admin@test.com",
            password="TestPass123!",
            first_name="Test",
            last_name="Admin",
            role="ADMIN"
        )

    # ── Test 1: Unauthenticated access is blocked ──────────────
    def test_unauthenticated_cannot_access_bookings(self):
        """No token = 401 Unauthorized."""
        self.client.credentials()  # no auth token
        response = self.client.get("/api/bookings/my-bookings/")
        self.assertEqual(response.status_code, 401,
            "Unauthenticated user should get 401 on bookings endpoint")

    def test_unauthenticated_cannot_access_profile(self):
        """No token = 401 on profile endpoint."""
        self.client.credentials()
        response = self.client.get("/api/users/profile/")
        self.assertEqual(response.status_code, 401,
            "Unauthenticated user should get 401 on profile endpoint")

    # ── Test 2: Customer cannot access Admin endpoints ──────────
    def test_customer_cannot_view_all_users(self):
        """Customer should not see the admin users list."""
        self.client.force_authenticate(user=self.customer)
        response = self.client.get("/api/users/admin/users/")
        self.assertIn(response.status_code, [403, 401],
            "Customer should get 403 on admin users endpoint")

    def test_customer_cannot_view_all_bookings(self):
        """Customer should not see all bookings — only their own."""
        self.client.force_authenticate(user=self.customer)
        response = self.client.get("/api/bookings/admin/all/")
        self.assertIn(response.status_code, [403, 401],
            "Customer should get 403 on admin bookings endpoint")

    # ── Test 3: Manager cannot create or edit listings ──────────
    def test_manager_cannot_create_listing(self):
        """Manager has view-only access — cannot create listings."""
        self.client.force_authenticate(user=self.manager)
        response = self.client.post("/api/listings/create/", {
            "title": "Test Listing",
            "destination": "Bali",
            "price_per_person": 1000,
        })
        self.assertIn(response.status_code, [403, 401],
            "Manager should get 403 when trying to create a listing")

    # ── Test 4: Invalid JWT token is rejected ───────────────────
    def test_invalid_token_rejected(self):
        """A tampered or fake token should return 401."""
        self.client.credentials(
            HTTP_AUTHORIZATION="Bearer thisisafaketoken12345"
        )
        response = self.client.get("/api/users/profile/")
        self.assertEqual(response.status_code, 401,
            "Invalid JWT token should be rejected with 401")

    def test_malformed_token_rejected(self):
        """A malformed Bearer token should be rejected."""
        self.client.credentials(
            HTTP_AUTHORIZATION="Bearer aaaa.bbbb.cccc"
        )
        response = self.client.get("/api/users/profile/")
        self.assertEqual(response.status_code, 401,
            "Malformed JWT token should return 401")

    # ── Test 5: Login with wrong password fails ─────────────────
    def test_wrong_password_returns_error(self):
        """Brute force protection — wrong password should not return 200."""
        response = self.client.post("/api/users/login/", {
            "email": "customer@test.com",
            "password": "wrongpassword"
        })
        self.assertNotEqual(response.status_code, 200,
            "Login with wrong password should not return 200")

    # ── Test 6: Admin can access admin endpoints ─────────────────
    def test_admin_can_view_all_users(self):
        """Confirm Admin access works correctly."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/users/admin/users/")
        self.assertEqual(response.status_code, 200,
            "Admin should be able to access the users list")

    # ── Test 7: Travel Agent cannot approve listings ─────────────
    def test_agent_cannot_approve_listing(self):
        """Only Manager/Admin can approve — Travel Agent should be blocked."""
        self.client.force_authenticate(user=self.agent)
        response = self.client.post("/api/listings/999/approve/")
        self.assertIn(response.status_code, [403, 401, 404],
            "Travel Agent should not be able to approve listings")