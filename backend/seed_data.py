"""Seed initial products for Kani's Whisk & Bakes."""
from __future__ import annotations

from datetime import datetime, timezone

from models import Product

SEED_PRODUCTS = [
    Product(
        name="Classic Fudge Brownie",
        description="Dense, gooey chocolate brownie with a shiny crackle top. A cult favorite.",
        category="brownies",
        price=90,
        image_url="https://images.pexels.com/photos/4597835/pexels-photo-4597835.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        badges=["Bestseller"],
        rating=4.9,
        rating_count=214,
    ),
    Product(
        name="Walnut Fudge Brownie",
        description="Fudgy brownie loaded with roasted walnuts for that perfect crunch.",
        category="brownies",
        price=110,
        image_url="https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80",
        badges=["Bestseller"],
        rating=4.8,
        rating_count=182,
    ),
    Product(
        name="Nutella Stuffed Brownie",
        description="A molten Nutella core hidden inside a rich chocolate brownie.",
        category="brownies",
        price=140,
        image_url="https://images.unsplash.com/photo-1611329857570-f02f340e7378?auto=format&fit=crop&w=900&q=80",
        badges=["New"],
        rating=4.7,
        rating_count=63,
    ),
    Product(
        name="Eggless Chocolate Truffle Cake",
        description="Silky ganache-glazed dark chocolate cake — 100% eggless.",
        category="cakes",
        price=650,
        image_url="https://images.unsplash.com/photo-1549572189-dddb1adf739b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwzfHxnb3VybWV0JTIwY2FrZSUyMGFlc3RoZXRpY3xlbnwwfHx8fDE3ODQ3MjE5ODl8MA&ixlib=rb-4.1.0&q=85",
        badges=["Eggless", "Bestseller"],
        rating=4.9,
        rating_count=97,
        is_eggless=True,
    ),
    Product(
        name="Red Velvet Cream Cake",
        description="Classic red velvet with a tangy cream cheese frosting.",
        category="cakes",
        price=720,
        image_url="https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=900&q=80",
        badges=["New"],
        rating=4.7,
        rating_count=41,
    ),
    Product(
        name="Bundt Chocolate Cake",
        description="A cinematic bundt cake dripping with dark ganache.",
        category="cakes",
        price=780,
        image_url="https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxnb3VybWV0JTIwY2FrZSUyMGFlc3RoZXRpY3xlbnwwfHx8fDE3ODQ3MjE5ODl8MA&ixlib=rb-4.1.0&q=85",
        badges=["Bestseller"],
        rating=4.8,
        rating_count=88,
    ),
    Product(
        name="Chocolate Chip Cookies",
        description="Buttery, chewy cookies studded with dark chocolate chips.",
        category="cookies",
        price=180,
        image_url="https://images.pexels.com/photos/36446733/pexels-photo-36446733.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        badges=["Bestseller"],
        rating=4.8,
        rating_count=156,
    ),
    Product(
        name="Double Chocolate Cookies",
        description="Cocoa dough, chocolate chunks and a soft molten centre.",
        category="cookies",
        price=200,
        image_url="https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=80",
        badges=[],
        rating=4.6,
        rating_count=52,
    ),
    Product(
        name="Vanilla Buttercream Cupcakes (Box of 6)",
        description="Six vanilla cupcakes topped with silky buttercream swirls.",
        category="cupcakes",
        price=360,
        image_url="https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=900&q=80",
        badges=[],
        rating=4.7,
        rating_count=44,
    ),
    Product(
        name="Chocolate Ganache Cupcakes (Box of 6)",
        description="Rich chocolate cupcakes with a glossy ganache finish.",
        category="cupcakes",
        price=420,
        image_url="https://images.unsplash.com/photo-1599785209707-a456fc1337d8?auto=format&fit=crop&w=900&q=80",
        badges=["New"],
        rating=4.8,
        rating_count=29,
    ),
    Product(
        name="Eggless Blueberry Cheesecake",
        description="No-bake blueberry cheesecake on a buttery biscuit base — eggless.",
        category="eggless",
        price=850,
        image_url="https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=900&q=80",
        badges=["Eggless", "New"],
        rating=4.9,
        rating_count=37,
        is_eggless=True,
    ),
    Product(
        name="Eggless Almond Choco Brownie",
        description="Fudgy eggless brownie loaded with roasted almonds.",
        category="eggless",
        price=120,
        image_url="https://images.unsplash.com/photo-1564355808539-22fda35bed7e?auto=format&fit=crop&w=900&q=80",
        badges=["Eggless"],
        rating=4.7,
        rating_count=68,
        is_eggless=True,
    ),
]


async def seed_products(db) -> None:
    count = await db.products.count_documents({})
    if count > 0:
        return
    docs = []
    for p in SEED_PRODUCTS:
        d = p.model_dump()
        d["created_at"] = d["created_at"].isoformat() if isinstance(d["created_at"], datetime) else d["created_at"]
        docs.append(d)
    await db.products.insert_many(docs)


async def seed_reviews(db) -> None:
    count = await db.reviews.count_documents({})
    if count > 0:
        return
    now = datetime.now(timezone.utc).isoformat()
    seed = [
        {"id": "r1", "product_id": None, "user_id": None, "author_name": "Aditi R.", "rating": 5,
         "text": "The walnut brownies are unreal — perfectly fudgy. Ordering again this weekend!", "approved": True, "created_at": now},
        {"id": "r2", "product_id": None, "user_id": None, "author_name": "Karthik M.", "rating": 5,
         "text": "Truffle cake for my mom's birthday — she loved it. Feels premium and tastes even better.", "approved": True, "created_at": now},
        {"id": "r3", "product_id": None, "user_id": None, "author_name": "Priya S.", "rating": 4,
         "text": "Eggless cheesecake was a dream. Delivery was on time in Adyar.", "approved": True, "created_at": now},
    ]
    await db.reviews.insert_many(seed)
