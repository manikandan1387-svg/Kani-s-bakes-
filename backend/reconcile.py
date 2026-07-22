"""UPI SMS parser + reconciliation helpers.

Handles noisy Indian bank SMSes / notifications, extracting UTR references
and INR amounts so incoming UPI credits can be auto-matched to pending orders.
"""
from __future__ import annotations

import re
from typing import Dict, List, Optional


# UTR patterns:
# - Most banks send 12-digit numeric UTRs (RRN).
# - Some send alphanumeric of up to 22 chars.
# - Keywords: "UPI Ref", "UPI Ref no", "Ref no", "RRN", "Txn Ref", "Reference".
_UTR_KEYWORDS = re.compile(
    r"(?:UPI\s*(?:Ref(?:erence)?(?:\s*(?:No|#|:))?|/CR/)|RRN|Txn\s*Ref(?:erence)?(?:\s*(?:No|#|:))?|Reference(?:\s*(?:No|#|:))?)"
    r"[\s:.\-#]*([A-Za-z0-9]{6,22})",
    re.IGNORECASE,
)
_UTR_BARE_12 = re.compile(r"(?<!\d)(\d{12})(?!\d)")

# Amount: "Rs 250", "Rs. 250.00", "INR 250", "credited by Rs 250"
_AMOUNT = re.compile(
    r"(?:Rs\.?|INR|₹)\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)",
    re.IGNORECASE,
)


def _clean_amount(raw: str) -> Optional[float]:
    try:
        return float(raw.replace(",", ""))
    except ValueError:
        return None


def parse_upi_sms(text: str) -> List[Dict]:
    """Parse one blob of SMS text (which may contain multiple SMSes separated by
    blank lines) into a list of `{utr, amount, raw}` records.

    Only records that have BOTH a utr and an amount are returned.
    """
    if not text or not text.strip():
        return []

    # Split by blank lines OR by ---
    chunks = re.split(r"\n\s*\n|---+", text.strip())
    results: List[Dict] = []
    for chunk in chunks:
        chunk = chunk.strip()
        if not chunk:
            continue
        # Only consider "credit" SMSes to avoid matching debits.
        lower = chunk.lower()
        is_credit = any(k in lower for k in ("credited", "received", "credit", "/cr/"))
        is_debit_only = any(k in lower for k in ("debited", "spent", "paid to", "/dr/")) and not is_credit
        if is_debit_only:
            continue

        utr = None
        m = _UTR_KEYWORDS.search(chunk)
        if m:
            utr = m.group(1).upper()
        if not utr:
            m2 = _UTR_BARE_12.search(chunk)
            if m2:
                utr = m2.group(1)

        amount = None
        m3 = _AMOUNT.search(chunk)
        if m3:
            amount = _clean_amount(m3.group(1))

        if utr and amount is not None:
            results.append({"utr": utr, "amount": amount, "raw": chunk})
    return results
