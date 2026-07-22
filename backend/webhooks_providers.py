"""Payment-provider webhook adapters.

We accept the *native* payload shape of each provider (no external mapper
required) and normalise to `{utr, amount}` events. Signature verification is
provider-specific.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
from typing import List, Optional, Tuple


# --------------------------------------------------------------------- Razorpay
def verify_razorpay(raw_body: bytes, signature_header: str) -> bool:
    secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "")
    if not secret or not signature_header:
        return False
    expected = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature_header.strip())


def extract_razorpay_events(body: dict) -> List[dict]:
    """Razorpay `payment.captured` webhook.

    Docs: https://razorpay.com/docs/webhooks/payloads/payments/
    We only take UPI payments; amount is in paise.
    """
    if body.get("event") not in ("payment.captured", "payment.authorized"):
        return []
    payment = ((body.get("payload") or {}).get("payment") or {}).get("entity") or {}
    if payment.get("method") != "upi":
        return []
    amount_paise = payment.get("amount")
    if amount_paise is None:
        return []
    acquirer = payment.get("acquirer_data") or {}
    utr = (
        acquirer.get("rrn")
        or acquirer.get("upi_transaction_id")
        or (payment.get("upi") or {}).get("transaction_id")
        or payment.get("id")
    )
    if not utr:
        return []
    return [{
        "utr": str(utr).upper(),
        "amount": round(float(amount_paise) / 100.0, 2),
        "payer_vpa": (payment.get("upi") or {}).get("vpa"),
    }]


# --------------------------------------------------------------------- Cashfree
def verify_cashfree(raw_body: bytes, signature_header: str, timestamp_header: str) -> bool:
    secret = os.environ.get("CASHFREE_WEBHOOK_SECRET", "")
    if not secret or not signature_header or not timestamp_header:
        return False
    signed = (timestamp_header + raw_body.decode("utf-8")).encode("utf-8")
    digest = hmac.new(secret.encode("utf-8"), signed, hashlib.sha256).digest()
    expected = base64.b64encode(digest).decode("utf-8")
    return hmac.compare_digest(expected, signature_header.strip())


def extract_cashfree_events(body: dict) -> List[dict]:
    """Cashfree `PAYMENT_SUCCESS_WEBHOOK` payload.

    Docs: https://www.cashfree.com/docs/payments/online/webhooks/payment-webhooks
    Amount is already in INR (float). UTR is in `payment.bank_reference`
    or `payment.payment_utr` depending on channel.
    """
    if body.get("type") not in ("PAYMENT_SUCCESS_WEBHOOK", "PAYMENT_USER_DROPPED_WEBHOOK"):
        return []
    if body.get("type") != "PAYMENT_SUCCESS_WEBHOOK":
        return []
    data = body.get("data") or {}
    payment = data.get("payment") or {}
    if str(payment.get("payment_group") or payment.get("payment_method") or "").lower() not in ("upi", ""):
        # only take upi (blank = older payload where method missing)
        if str(payment.get("payment_method") or "").lower().find("upi") == -1:
            return []
    amount = payment.get("payment_amount") or payment.get("payment_settlement_amount")
    if amount is None:
        return []
    utr = (
        payment.get("bank_reference")
        or payment.get("payment_utr")
        or (payment.get("payment_method_details") or {}).get("upi", {}).get("utr")
        or payment.get("cf_payment_id")
    )
    if not utr:
        return []
    return [{
        "utr": str(utr).upper(),
        "amount": round(float(amount), 2),
        "payer_vpa": (payment.get("payment_method_details") or {}).get("upi", {}).get("upi_id"),
    }]
