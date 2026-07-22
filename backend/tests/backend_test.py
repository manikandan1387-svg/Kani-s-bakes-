"""End-to-end backend API tests for Kani's Whisk & Bakes."""
import os
import time
import uuid

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    # fall back to frontend/.env if not exported
    from pathlib import Path
    env_file = Path("/app/frontend/.env")
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().strip('"')
                break
BASE_URL = (BASE_URL or "").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "manikandan1387@gmail.com"
ADMIN_PASSWORD = "Kani@2026"

VALID_STATUSES = ["new", "baking", "packed", "out_for_delivery", "delivered", "cancelled"]


@pytest.fixture(scope="session")
def s():
    return requests.Session()


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["user"]["role"] == "admin"
    assert data["token"]
    return data["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def customer(s):
    email = f"test_cust_{uuid.uuid4().hex[:8]}@example.com"
    password = "Test1234!"
    r = s.post(f"{API}/auth/register", json={
        "email": email, "password": password, "name": "Test Customer", "phone": "9876543210"
    })
    assert r.status_code == 200, f"Register failed: {r.status_code} {r.text}"
    user = r.json()
    assert user["role"] == "customer"
    # Get token via login (register doesn't return token)
    r2 = requests.post(f"{API}/auth/login", json={"email": email, "password": password})
    assert r2.status_code == 200
    return {"email": email, "password": password, "user": user, "token": r2.json()["token"]}


@pytest.fixture(scope="session")
def customer_headers(customer):
    return {"Authorization": f"Bearer {customer['token']}"}


# ---------- Health ----------
class TestHealth:
    def test_root(self):
        r = requests.get(f"{API}/")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"


# ---------- Products ----------
class TestProducts:
    def test_list_all_products(self):
        r = requests.get(f"{API}/products")
        assert r.status_code == 200
        products = r.json()
        assert isinstance(products, list)
        assert len(products) >= 12, f"Expected >=12 seeded products, got {len(products)}"
        # Check categories present
        cats = {p["category"] for p in products}
        for c in ["brownies", "cakes", "cookies", "cupcakes", "eggless"]:
            assert c in cats, f"Missing category {c}"

    @pytest.mark.parametrize("cat", ["brownies", "cakes", "cookies", "cupcakes", "eggless"])
    def test_category_filter(self, cat):
        r = requests.get(f"{API}/products", params={"category": cat})
        assert r.status_code == 200
        products = r.json()
        assert len(products) > 0, f"No products in {cat}"
        for p in products:
            assert p["category"] == cat


# ---------- Auth ----------
class TestAuth:
    def test_admin_login_success(self, admin_token):
        # Fixture already asserts; here re-check /auth/me returns admin
        r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        me = r.json()
        assert me["email"] == ADMIN_EMAIL
        assert me["role"] == "admin"

    def test_admin_login_sets_cookie(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        assert "access_token" in r.cookies, f"access_token cookie not set, got: {list(r.cookies.keys())}"

    def test_bad_credentials(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrongpass"})
        assert r.status_code == 401

    def test_customer_me(self, customer, customer_headers):
        r = requests.get(f"{API}/auth/me", headers=customer_headers)
        assert r.status_code == 200
        assert r.json()["role"] == "customer"
        assert r.json()["email"] == customer["email"]

    def test_me_unauthenticated(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401


# ---------- Orders (guest) ----------
class TestGuestOrder:
    _order_code = None

    def _get_first_product_id(self):
        r = requests.get(f"{API}/products")
        return r.json()[0]

    def test_invalid_phone_rejected(self):
        p = self._get_first_product_id()
        r = requests.post(f"{API}/orders", json={
            "customer_name": "Guest", "customer_phone": "12345",
            "address": "12 baker street, chennai", "items": [
                {"product_id": p["id"], "name": p["name"], "price": p["price"], "quantity": 1}
            ]
        })
        assert r.status_code == 422

    def test_create_guest_order(self):
        p = self._get_first_product_id()
        r = requests.post(f"{API}/orders", json={
            "customer_name": "Guest Buyer",
            "customer_phone": "9876543211",
            "address": "12 Baker Street, T Nagar, Chennai 600017",
            "notes": "Ring the bell twice",
            "items": [
                {"product_id": p["id"], "name": p["name"], "price": p["price"], "quantity": 2}
            ],
            "payment_confirmed": True,
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["order_code"].startswith("KWB-"), data
        assert data["total"] == round(p["price"] * 2 + 50, 2)
        TestGuestOrder._order_code = data["order_code"]

    def test_track_order(self):
        code = TestGuestOrder._order_code
        assert code, "Order code missing"
        r = requests.get(f"{API}/orders/track/{code}")
        assert r.status_code == 200
        doc = r.json()
        assert doc["order_code"] == code
        assert doc["status"] == "new"
        assert doc["delivery_fee"] == 50

    def test_track_missing(self):
        r = requests.get(f"{API}/orders/track/KWB-NOPE1")
        assert r.status_code == 404


# ---------- Customer orders ----------
class TestCustomerOrders:
    def test_customer_creates_order_and_sees_it(self, customer, customer_headers):
        p = requests.get(f"{API}/products").json()[0]
        r = requests.post(f"{API}/orders", json={
            "customer_name": customer["user"]["name"],
            "customer_phone": "9876543212",
            "customer_email": customer["email"],
            "address": "45 Cake Lane, Adyar, Chennai 600020",
            "items": [{"product_id": p["id"], "name": p["name"], "price": p["price"], "quantity": 1}],
        }, headers=customer_headers)
        assert r.status_code == 200, r.text
        code = r.json()["order_code"]

        r2 = requests.get(f"{API}/orders/mine", headers=customer_headers)
        assert r2.status_code == 200
        codes = [o["order_code"] for o in r2.json()]
        assert code in codes

    def test_mine_requires_auth(self):
        r = requests.get(f"{API}/orders/mine")
        assert r.status_code == 401


# ---------- Admin endpoints ----------
class TestAdminEndpoints:
    def test_unauth_orders_list_rejected(self):
        r = requests.get(f"{API}/orders")
        assert r.status_code in (401, 403)

    def test_unauth_broadcast_rejected(self):
        r = requests.post(f"{API}/admin/broadcast", json={"message": "hi"})
        assert r.status_code in (401, 403)

    def test_unauth_stats_rejected(self):
        r = requests.get(f"{API}/admin/stats")
        assert r.status_code in (401, 403)

    def test_customer_cannot_access_admin_orders(self, customer_headers):
        r = requests.get(f"{API}/orders", headers=customer_headers)
        assert r.status_code == 403

    def test_admin_list_orders(self, admin_headers):
        r = requests.get(f"{API}/orders", headers=admin_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_stats(self, admin_headers):
        r = requests.get(f"{API}/admin/stats", headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        for k in ["orders_today", "revenue_today", "revenue_total", "pending",
                  "avg_rating", "review_count", "expenses_total", "profit_estimate"]:
            assert k in data, f"Missing key {k}"

    def test_admin_broadcast_mock(self, admin_headers):
        r = requests.post(f"{API}/admin/broadcast",
                          json={"message": "Test broadcast — free cookies today!"},
                          headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        assert "sent_to" in data
        assert data["mocked"] is True

    def test_update_order_status_flow(self, admin_headers):
        # Create a fresh order first (avoids parallel test ordering issues)
        p = requests.get(f"{API}/products").json()[0]
        cr = requests.post(f"{API}/orders", json={
            "customer_name": "TEST_StatusFlow",
            "customer_phone": "9876543299",
            "address": "1 Status Rd, Chennai 600001",
            "items": [{"product_id": p["id"], "name": p["name"], "price": p["price"], "quantity": 1}],
        })
        assert cr.status_code == 200, cr.text
        # Get admin view to fetch id
        orders = requests.get(f"{API}/orders", headers=admin_headers).json()
        target = next((o for o in orders if o["order_code"] == cr.json()["order_code"]), None)
        assert target, "Newly created order not visible to admin"
        oid = target["id"]

        # Invalid status
        r_bad = requests.patch(f"{API}/orders/{oid}/status",
                               json={"status": "flying"}, headers=admin_headers)
        assert r_bad.status_code == 400

        # Valid
        r = requests.patch(f"{API}/orders/{oid}/status",
                           json={"status": "baking"}, headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["status"] == "baking"

    def test_product_crud(self, admin_headers):
        # Create
        payload = {
            "name": "TEST_Coffee Mocha Brownie",
            "description": "Test product",
            "category": "brownies",
            "price": 150,
            "image_url": "https://example.com/x.jpg",
            "badges": ["New"],
            "is_eggless": False,
            "is_available": True,
        }
        r = requests.post(f"{API}/products", json=payload, headers=admin_headers)
        assert r.status_code == 200, r.text
        pid = r.json()["id"]

        # Verify GET
        r_get = requests.get(f"{API}/products/{pid}")
        assert r_get.status_code == 200
        assert r_get.json()["name"] == payload["name"]

        # Patch
        r_upd = requests.patch(f"{API}/products/{pid}",
                               json={"price": 175.5}, headers=admin_headers)
        assert r_upd.status_code == 200
        assert r_upd.json()["price"] == 175.5

        # Delete
        r_del = requests.delete(f"{API}/products/{pid}", headers=admin_headers)
        assert r_del.status_code == 200

        # Verify gone
        assert requests.get(f"{API}/products/{pid}").status_code == 404

    def test_unauth_product_create_rejected(self):
        r = requests.post(f"{API}/products", json={
            "name": "no", "category": "brownies", "price": 10
        })
        assert r.status_code in (401, 403)

    def test_expense_crud(self, admin_headers):
        r = requests.post(f"{API}/expenses", json={
            "date": "2026-01-15",
            "category": "ingredients",
            "description": "TEST_flour",
            "amount": 500,
        }, headers=admin_headers)
        assert r.status_code == 200, r.text
        eid = r.json()["id"]

        # cleanup
        r_del = requests.delete(f"{API}/expenses/{eid}", headers=admin_headers)
        assert r_del.status_code == 200


# ---------- Reviews ----------
class TestReviews:
    def test_public_reviews_are_approved_only(self):
        r = requests.get(f"{API}/reviews")
        assert r.status_code == 200, r.text
        for rv in r.json():
            assert rv["approved"] is True

    def test_create_review_is_pending(self):
        r = requests.post(f"{API}/reviews", json={
            "author_name": "TEST_Anon",
            "rating": 5,
            "text": "TEST_review — great brownies!",
        })
        assert r.status_code == 200, r.text
        assert r.json()["approved"] is False
        return r.json()["id"]

    def test_admin_can_see_all_reviews(self, admin_headers):
        # First create a pending
        cr = requests.post(f"{API}/reviews", json={
            "author_name": "TEST_Pending",
            "rating": 4,
            "text": "TEST_admin_all",
        })
        assert cr.status_code == 200
        pid = cr.json()["id"]

        r = requests.get(f"{API}/reviews", params={"all": "true"}, headers=admin_headers)
        assert r.status_code == 200
        ids = [x["id"] for x in r.json()]
        assert pid in ids

        # Approve
        r_ap = requests.patch(f"{API}/reviews/{pid}/approve",
                              params={"approved": "true"}, headers=admin_headers)
        assert r_ap.status_code == 200

        # cleanup
        requests.delete(f"{API}/reviews/{pid}", headers=admin_headers)


if __name__ == "__main__":
    import sys
    sys.exit(pytest.main([__file__, "-v"]))
