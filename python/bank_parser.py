"""
Bank statement PDF parser.
Usage: python3 bank_parser.py <pdf_path>
Output: JSON array of transactions to stdout.

Each transaction:
  { "posted_at": "YYYY-MM-DD", "description": "...", "amount_cents": int }

amount_cents:
  negative = expense/debit
  positive = income/credit

Supports:
  - US Bank credit card statements (Purchases/Credits sections)
  - Capital One credit card statements (Trans Date / Post Date format)
"""

import sys
import re
import json
from datetime import datetime

try:
    import pdfplumber
except ImportError:
    print(json.dumps({"error": "pdfplumber not installed. Run: pip install pdfplumber"}))
    sys.exit(1)


def dollars_to_cents(s: str) -> int:
    """Convert '$1,234.56' or '-$1,234.56' or '1234.56' to integer cents."""
    s = s.strip().replace(",", "").replace("$", "")
    negative = s.startswith("-")
    s = s.lstrip("-")
    try:
        return int(round(float(s) * 100)) * (-1 if negative else 1)
    except ValueError:
        return 0


def parse_date(date_str: str, year: str) -> str | None:
    """Parse mm/dd (with known year) or mm/dd/yyyy into YYYY-MM-DD."""
    for fmt, s in [("%m/%d/%Y", f"{date_str}/{year}"), ("%m/%d/%Y", date_str)]:
        try:
            return datetime.strptime(s, fmt).strftime("%Y-%m-%d")
        except ValueError:
            pass
    for fmt in ("%m/%d/%Y", "%Y-%m-%d", "%m/%d/%y"):
        try:
            return datetime.strptime(date_str, fmt).strftime("%Y-%m-%d")
        except ValueError:
            pass
    return None


def parse_cap1_date(month: str, day: str, year: str) -> str | None:
    """Parse Capital One 'Mar 2'-style dates into YYYY-MM-DD."""
    try:
        return datetime.strptime(f"{month} {day} {year}", "%b %d %Y").strftime("%Y-%m-%d")
    except ValueError:
        return None


def extract_year(text: str) -> str:
    """Find the first 4-digit year in the text (for statements without full dates)."""
    m = re.search(r"\b(20\d{2})\b", text)
    return m.group(1) if m else str(datetime.now().year)


# ── US Bank credit card format ─────────────────────────────────────────────────
# Line pattern: mm/dd mm/dd REFNUM Description $amount
CC_PATTERN = re.compile(
    r"(\d{2}/\d{2})\s+(\d{2}/\d{2})\s+\d{4}\s+(.+?)\s+(-?\$[\d,]+\.\d{2})"
)


def parse_usbank_cc(text: str) -> list[dict]:
    """Parse US Bank credit card statement sections."""
    year = extract_year(text)

    def section(start: str, end: str) -> str:
        m = re.search(rf"{re.escape(start)}(.*?){re.escape(end)}", text, re.DOTALL)
        return m.group(1) if m else ""

    charges_text = section("Purchases and Other Debits", "TOTAL THIS PERIOD")
    credits_text = section("Payments and Other Credits", "TOTAL THIS PERIOD")

    results = []
    for match in CC_PATTERN.findall(charges_text):
        _post_date, trans_date, desc, amount = match
        date = parse_date(trans_date, year)
        if date:
            results.append({
                "posted_at": date,
                "description": desc.strip(),
                "amount_cents": -abs(dollars_to_cents(amount)),  # expenses are negative
            })

    for match in CC_PATTERN.findall(credits_text):
        trans_date, _post_date, desc, amount = match
        date = parse_date(trans_date, year)
        if date:
            results.append({
                "posted_at": date,
                "description": desc.strip(),
                "amount_cents": abs(dollars_to_cents(amount)),  # credits are positive
            })

    return results


# ── Capital One credit card format ─────────────────────────────────────────────
# Line pattern: Mon D  Mon D  Description  $amount
# e.g.  Mar 2  Mar 4  ALL ABOUT POKER RANCHO PALOS CA  $37.29
CAP1_PATTERN = re.compile(
    r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s+"
    r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s+"
    r"(.+?)\s+\$([\d,]+\.\d{2})\s*$",
    re.MULTILINE,
)

CAP1_PAYMENT = re.compile(r"CAPITAL ONE AUTOPAY PYMT -", re.IGNORECASE)


def parse_capitalone_cc(text: str) -> list[dict]:
    """Parse Capital One credit card statement (charges only)."""
    year = extract_year(text)
    results = []
    for match in CAP1_PATTERN.findall(text):
        trans_month, trans_day, _post_month, _post_day, desc, amount = match
        if CAP1_PAYMENT.search(desc):
            continue
        date = parse_cap1_date(trans_month, trans_day, year)
        if date:
            results.append({
                "posted_at": date,
                "description": desc.strip(),
                "amount_cents": -dollars_to_cents(amount),  # charges are expenses
            })
    return results


def parse_pdf(path: str) -> list[dict]:
    with pdfplumber.open(path) as pdf:
        pages_text = [p.extract_text() or "" for p in pdf.pages]
    full_text = "\n".join(pages_text)

    # Try US Bank CC format
    if "Purchases and Other Debits" in full_text or "Payments and Other Credits" in full_text:
        results = parse_usbank_cc(full_text)
        if results:
            return results

    # Try Capital One CC format
    if "Trans Date" in full_text and "Post Date" in full_text:
        results = parse_capitalone_cc(full_text)
        if results:
            return results

    raise ValueError("Unrecognized statement format. Supported: US Bank CC, Capital One CC.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: bank_parser.py <pdf_path>"}))
        sys.exit(1)

    try:
        transactions = parse_pdf(sys.argv[1])
        print(json.dumps(transactions))
    except Exception as e:
        sys.stderr.write(f"ERROR: {e}\n")
        sys.exit(1)
