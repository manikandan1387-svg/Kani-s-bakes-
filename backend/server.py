"""Kani's Whisk & Bakes — FastAPI backend."""
from __future__ import annotations

from dotenv import load_dotenv
load_dotenv()

import logging
import os
import random
import string
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, FastAPI, HTTPException, Query, Request, Response
from motor.motor_asyncio import AsyncIOMotorClient
from starlette.middleware.cors import CORSMiddleware

import auth as auth_utils
from auth import (
    clear_auth_cookie,
    create_access_token,
    get_current_user,
    hash_password,
    require_admin,
    set_auth_cookie,
    verify_password,
)
from models import (
    BroadcastInput,
    Expense,
    ExpenseCreate,
    LoginInput,
    ORDER_STATUSES,
    Order,
    OrderCreate,
    OrderStatusUpdate,
    PAYMENT_STATUSES,
    PaymentUpdate,
    Product,
    ProductCreate,
    ProductUpdate,
    RegisterInput,
    Review,
    ReviewCreate,
    UserPublic,
)
from seed_data import seed_products, seed_reviews

# ---------- Mongo ----------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# ---------- App ----------
app = FastAPI(title="Kani's Whisk & Bakes API")
api = APIRouter(prefix="/api")

cors_origins = os.environ.get("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("kwb")


# ---------- Helpers ----------
def _strip_mongo(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


def _order_code() -> str:
    return "KWB-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=5))


async def send_whatsapp_mock(to: str, message: str) -> None:
    """Mock WhatsApp notification (Twilio credentials not provided yet)."""
    logger.info("[WhatsApp MOCK] to=%s | %s", to, message)


# ---------- Startup ----------
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.products.create_index("category")
    await db.orders.create_index("order_code", unique=True)
    await db.orders.create_index("user_id")

    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        from models import User
        admin = User(
            email=admin_email,
            name="Kani",
            role="admin",
            password_hash=hash_password(admin_password),
        )
        doc = admin.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        await db.users.insert_one(doc)
        logger.info("Seeded admin user: %s", admin_email)
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password), "role": "admin"}},
        )
        logger.info("Rehashed admin password for %s", admin_email)

    await seed_products(db)
    await seed_reviews(db)

    # Backfill: mark legacy orders (created before payment reconciliation) as verified
    # so they aren't blocked. New orders default to 'pending'.
    await db.orders.update_many(
        {"payment_status": {"$exists": False}},
        {"$set": {"payment_status": "verified", "upi_reference": "", "payment_note": ""}},
    )


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


# ---------- Health ----------
@api.get("/")
async def root():
    return {"app": "Kani's Whisk & Bakes", "status": "ok"}


# ---------- Auth ----------
@api.post("/auth/register", response_model=UserPublic)
async def register(payload: RegisterInput, response: Response):
    email = payload.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    from models import User
    user = User(
        email=email,
        name=payload.name,
        phone=payload.phone,
        role="customer",
        password_hash=hash_password(payload.password),
    )
    doc = user.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.users.insert_one(doc)
    token = create_access_token(user.id, user.email, user.role)
    set_auth_cookie(response, token)
    return UserPublic(id=user.id, email=user.email, name=user.name, phone=user.phone, role=user.role)


@api.post("/auth/login")
async def login(payload: LoginInput, response: Response):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], user["email"], user["role"])
    set_auth_cookie(response, token)
    return {
        "user": UserPublic(
            id=user["id"], email=user["email"], name=user["name"],
            phone=user.get("phone", ""), role=user["role"],
        ),
        "token": token,
    }


@api.post("/auth/logout")
async def logout(response: Response):
    clear_auth_cookie(response)
    return {"ok": True}


@api.get("/auth/me", response_model=UserPublic)
async def me(user: dict = Depends(get_current_user)):
    return UserPublic(
        id=user["id"], email=user["email"], name=user["name"],
        phone=user.get("phone", ""), role=user["role"],
    )


# ---------- Products ----------
@api.get("/products", response_model=List[Product])
async def list_products(category: Optional[str] = Query(default=None), eggless: Optional[bool] = None):
    query: dict = {}
    if category and category != "all":
        query["category"] = category
    if eggless:
        query["is_eggless"] = True
    docs = await db.products.find(query, {"_id": 0}).to_list(500)
    for d in docs:
        if isinstance(d.get("created_at"), str):
            try:
                d["created_at"] = datetime.fromisoformat(d["created_at"])
            except ValueError:
                d["created_at"] = datetime.now(timezone.utc)
    return docs


@api.get("/products/{pid}", response_model=Product)
async def get_product(pid: str):
    doc = await db.products.find_one({"id": pid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return doc


@api.post("/products", response_model=Product)
async def create_product(payload: ProductCreate, _admin: dict = Depends(require_admin)):
    product = Product(**payload.model_dump())
    doc = product.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.products.insert_one(doc)
    return product


@api.patch("/products/{pid}", response_model=Product)
async def update_product(pid: str, payload: ProductUpdate, _admin: dict = Depends(require_admin)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.products.update_one({"id": pid}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return await db.products.find_one({"id": pid}, {"_id": 0})


@api.delete("/products/{pid}")
async def delete_product(pid: str, _admin: dict = Depends(require_admin)):
    result = await db.products.delete_one({"id": pid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}


# ---------- Orders ----------
@api.post("/orders")
async def create_order(payload: OrderCreate, request: Request):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Recompute subtotal from server-side products to prevent tampering
    subtotal = 0.0
    fixed_items = []
    for item in payload.items:
        prod = await db.products.find_one({"id": item.product_id}, {"_id": 0})
        if not prod:
            raise HTTPException(status_code=400, detail=f"Product not found: {item.product_id}")
        qty = max(1, int(item.quantity))
        subtotal += float(prod["price"]) * qty
        fixed_items.append({
            "product_id": prod["id"],
            "name": prod["name"],
            "price": float(prod["price"]),
            "quantity": qty,
            "image_url": prod.get("image_url", ""),
        })

    delivery_fee = 50.0
    total = subtotal + delivery_fee

    # Attach to logged-in user if any
    user_id = None
    user_email = payload.customer_email
    try:
        current = await get_current_user(request)
        user_id = current["id"]
        if not user_email:
            user_email = current["email"]
    except HTTPException:
        pass

    order = Order(
        order_code=_order_code(),
        user_id=user_id,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        customer_email=user_email,
        address=payload.address,
        notes=payload.notes,
        items=fixed_items,  # type: ignore[arg-type]
        subtotal=round(subtotal, 2),
        delivery_fee=delivery_fee,
        total=round(total, 2),
        upi_id=os.environ.get("UPI_ID", ""),
        upi_reference=payload.upi_reference.strip().upper(),
        payment_confirmed=payload.payment_confirmed,
        payment_status="pending",
        status="new",
    )
    doc = order.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    # OrderItem serialised
    doc["items"] = [i if isinstance(i, dict) else i.model_dump() for i in order.items]
    await db.orders.insert_one(doc)

    msg = (
        f"New order {order.order_code}\n"
        f"{order.customer_name} — {order.customer_phone}\n"
        f"Total ₹{order.total:.0f} ({len(order.items)} items)\n"
        f"UPI ref: {order.upi_reference} (verify before dispatch)\n"
        f"Address: {order.address}"
    )
    await send_whatsapp_mock(os.environ.get("KANI_WHATSAPP_TO", ""), msg)
    if order.customer_email or order.customer_phone:
        await send_whatsapp_mock(
            order.customer_phone,
            f"Thanks {order.customer_name}! Order {order.order_code} received. Total ₹{order.total:.0f}. Track at your order page.",
        )

    return {"order_code": order.order_code, "id": order.id, "total": order.total}


@api.get("/orders/track/{code}")
async def track_order(code: str):
    doc = await db.orders.find_one({"order_code": code.upper()}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    return doc


@api.get("/orders/mine")
async def my_orders(user: dict = Depends(get_current_user)):
    docs = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs


@api.get("/orders")
async def list_orders(status: Optional[str] = None, _admin: dict = Depends(require_admin)):
    query: dict = {}
    if status:
        query["status"] = status
    docs = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


@api.patch("/orders/{oid}/status")
async def update_status(oid: str, payload: OrderStatusUpdate, _admin: dict = Depends(require_admin)):
    if payload.status not in ORDER_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")
    order = await db.orders.find_one({"id": oid}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Guard: can only advance past 'new' if payment is verified.
    advancing = payload.status not in ("new", "cancelled")
    if advancing and order.get("payment_status") != "verified":
        raise HTTPException(
            status_code=400,
            detail="Verify UPI payment before advancing this order.",
        )

    await db.orders.update_one(
        {"id": oid},
        {"$set": {"status": payload.status, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    doc = await db.orders.find_one({"id": oid}, {"_id": 0})
    await send_whatsapp_mock(
        doc["customer_phone"],
        f"Order {doc['order_code']} update: status is now '{payload.status.replace('_', ' ').title()}'.",
    )
    return doc


@api.patch("/orders/{oid}/payment")
async def update_payment(oid: str, payload: PaymentUpdate, _admin: dict = Depends(require_admin)):
    if payload.payment_status not in PAYMENT_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid payment status")
    order = await db.orders.find_one({"id": oid}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    updates = {
        "payment_status": payload.payment_status,
        "payment_note": payload.payment_note,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if payload.payment_status == "verified":
        updates["payment_verified_at"] = datetime.now(timezone.utc).isoformat()
        updates["payment_confirmed"] = True
    elif payload.payment_status == "rejected":
        updates["payment_verified_at"] = None
        updates["payment_confirmed"] = False
        # If admin rejects payment, park the order at 'new' (won't move forward).
        updates["status"] = "new"

    await db.orders.update_one({"id": oid}, {"$set": updates})
    doc = await db.orders.find_one({"id": oid}, {"_id": 0})

    if payload.payment_status == "verified":
        await send_whatsapp_mock(
            doc["customer_phone"],
            f"Great news! We've verified your UPI payment for {doc['order_code']}. Kani is on it 🍫",
        )
    elif payload.payment_status == "rejected":
        note = f" — {payload.payment_note}" if payload.payment_note else ""
        await send_whatsapp_mock(
            doc["customer_phone"],
            f"We couldn't verify the UPI payment for {doc['order_code']}{note}. Please reach out with a fresh UTR.",
        )
    return doc


# ---------- Reviews ----------
@api.get("/reviews", response_model=List[Review])
async def list_reviews(request: Request, all: bool = False):
    if all:
        # Admin-only view of pending + approved
        user = await get_current_user(request)
        if user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        query: dict = {}
    else:
        query = {"approved": True}
    docs = await db.reviews.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs


@api.get("/reviews/pending", response_model=List[Review])
async def list_pending_reviews(_admin: dict = Depends(require_admin)):
    docs = await db.reviews.find({"approved": False}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs


@api.post("/reviews", response_model=Review)
async def create_review(payload: ReviewCreate, request: Request):
    user_id = None
    try:
        current = await get_current_user(request)
        user_id = current["id"]
    except HTTPException:
        pass
    review = Review(
        product_id=payload.product_id,
        user_id=user_id,
        author_name=payload.author_name,
        rating=payload.rating,
        text=payload.text,
        approved=False,
    )
    doc = review.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.reviews.insert_one(doc)
    return review


@api.patch("/reviews/{rid}/approve")
async def approve_review(rid: str, approved: bool = True, _admin: dict = Depends(require_admin)):
    await db.reviews.update_one({"id": rid}, {"$set": {"approved": approved}})
    return {"ok": True}


@api.delete("/reviews/{rid}")
async def delete_review(rid: str, _admin: dict = Depends(require_admin)):
    await db.reviews.delete_one({"id": rid})
    return {"ok": True}


# ---------- Expenses ----------
@api.get("/expenses", response_model=List[Expense])
async def list_expenses(_admin: dict = Depends(require_admin)):
    docs = await db.expenses.find({}, {"_id": 0}).sort("date", -1).to_list(500)
    return docs


@api.post("/expenses", response_model=Expense)
async def create_expense(payload: ExpenseCreate, _admin: dict = Depends(require_admin)):
    exp = Expense(**payload.model_dump())
    doc = exp.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.expenses.insert_one(doc)
    return exp


@api.delete("/expenses/{eid}")
async def delete_expense(eid: str, _admin: dict = Depends(require_admin)):
    await db.expenses.delete_one({"id": eid})
    return {"ok": True}


# ---------- Stats ----------
@api.get("/admin/stats")
async def admin_stats(_admin: dict = Depends(require_admin)):
    today_iso = datetime.now(timezone.utc).date().isoformat()
    orders_today = await db.orders.count_documents({"created_at": {"$regex": f"^{today_iso}"}})
    pending = await db.orders.count_documents({"status": {"$in": ["new", "baking", "packed", "out_for_delivery"]}})
    delivered = await db.orders.count_documents({"status": "delivered"})
    pipeline = [
        {"$match": {"status": "delivered"}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}},
    ]
    agg = await db.orders.aggregate(pipeline).to_list(1)
    revenue = agg[0]["total"] if agg else 0

    pipeline_today = [
        {"$match": {"created_at": {"$regex": f"^{today_iso}"}}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}},
    ]
    agg_today = await db.orders.aggregate(pipeline_today).to_list(1)
    revenue_today = agg_today[0]["total"] if agg_today else 0

    # avg rating
    rev_pipeline = [
        {"$match": {"approved": True}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}},
    ]
    rev_agg = await db.reviews.aggregate(rev_pipeline).to_list(1)
    avg_rating = round(rev_agg[0]["avg"], 2) if rev_agg and rev_agg[0].get("avg") else 0.0
    review_count = rev_agg[0]["count"] if rev_agg else 0

    exp_pipeline = [{"$group": {"_id": None, "total": {"$sum": "$amount"}}}]
    exp_agg = await db.expenses.aggregate(exp_pipeline).to_list(1)
    expenses_total = exp_agg[0]["total"] if exp_agg else 0

    pending_payments = await db.orders.count_documents({"payment_status": "pending"})
    rejected_payments = await db.orders.count_documents({"payment_status": "rejected"})

    return {
        "orders_today": orders_today,
        "revenue_today": revenue_today,
        "revenue_total": revenue,
        "pending": pending,
        "delivered": delivered,
        "avg_rating": avg_rating,
        "review_count": review_count,
        "expenses_total": expenses_total,
        "profit_estimate": round(revenue - expenses_total, 2),
        "pending_payments": pending_payments,
        "rejected_payments": rejected_payments,
    }


# ---------- Broadcast ----------
@api.post("/admin/broadcast")
async def broadcast(payload: BroadcastInput, _admin: dict = Depends(require_admin)):
    phones = await db.orders.distinct("customer_phone")
    for p in phones:
        await send_whatsapp_mock(p, payload.message)
    return {"sent_to": len(phones), "mocked": True}


app.include_router(api)
