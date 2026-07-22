"""Pydantic data models for Kani's Whisk & Bakes."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _new_id() -> str:
    return uuid.uuid4().hex


class BaseDoc(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_new_id)
    created_at: datetime = Field(default_factory=_now)


# ------- Product -------
class Product(BaseDoc):
    name: str
    description: str = ""
    category: str  # brownies | cakes | cookies | cupcakes | eggless
    price: float
    image_url: str = ""
    badges: List[str] = Field(default_factory=list)  # Bestseller / New / Eggless
    rating: float = 0.0
    rating_count: int = 0
    is_eggless: bool = False
    is_available: bool = True


class ProductCreate(BaseModel):
    name: str
    description: str = ""
    category: str
    price: float
    image_url: str = ""
    badges: List[str] = Field(default_factory=list)
    is_eggless: bool = False
    is_available: bool = True


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    badges: Optional[List[str]] = None
    is_eggless: Optional[bool] = None
    is_available: Optional[bool] = None


# ------- User -------
class User(BaseDoc):
    email: EmailStr
    name: str
    phone: str = ""
    role: str = "customer"  # customer | admin
    password_hash: str


class UserPublic(BaseModel):
    id: str
    email: EmailStr
    name: str
    phone: str = ""
    role: str


class RegisterInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1)
    phone: str = ""


class LoginInput(BaseModel):
    email: EmailStr
    password: str


# ------- Order -------
class OrderItem(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int
    image_url: str = ""


ORDER_STATUSES = ["new", "baking", "packed", "out_for_delivery", "delivered", "cancelled"]


class Order(BaseDoc):
    order_code: str  # short human-readable, e.g. KWB-4F2A
    user_id: Optional[str] = None
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    address: str
    notes: str = ""
    items: List[OrderItem]
    subtotal: float
    delivery_fee: float = 50.0
    total: float
    upi_id: str = ""
    payment_confirmed: bool = False
    status: str = "new"
    updated_at: datetime = Field(default_factory=_now)


class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=1)
    customer_phone: str = Field(pattern=r"^\d{10}$")
    customer_email: Optional[EmailStr] = None
    address: str = Field(min_length=5)
    notes: str = ""
    items: List[OrderItem]
    payment_confirmed: bool = False


class OrderStatusUpdate(BaseModel):
    status: str


# ------- Review -------
class Review(BaseDoc):
    product_id: Optional[str] = None
    user_id: Optional[str] = None
    author_name: str
    rating: int = Field(ge=1, le=5)
    text: str
    approved: bool = False


class ReviewCreate(BaseModel):
    product_id: Optional[str] = None
    author_name: str = Field(min_length=1)
    rating: int = Field(ge=1, le=5)
    text: str = Field(min_length=1)


# ------- Expense -------
class Expense(BaseDoc):
    date: str  # ISO date
    category: str  # ingredients | packaging | delivery | marketing | other
    description: str = ""
    amount: float


class ExpenseCreate(BaseModel):
    date: str
    category: str
    description: str = ""
    amount: float


# ------- Broadcast -------
class BroadcastInput(BaseModel):
    message: str = Field(min_length=1)
