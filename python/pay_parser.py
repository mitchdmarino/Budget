"""
Paystub PDF parser.
Usage: python3 pay_parser.py <pdf_path>
Output: JSON object to stdout.

{
  "pay_date":              "YYYY-MM-DD",
  "gross_cents":           int,
  "taxes_cents":           int,   # statutory taxes (fed + state + FICA)
  "retirement_cents":      int,   # 401k / retirement plan contributions
  "other_deductions_cents": int,  # remaining pre/post-tax deductions
  "net_cents":             int
}

Parses paystubs that expose a summary table with columns:
  Gross Pay | Pre Tax Deductions | Statutory Taxes | Post Tax Deductions | Net Pay

Also scans all tables for a row containing a 401k/retirement keyword
to pull out retirement specifically from pre-tax deductions.
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


def to_cents(val) -> int:
    """Convert a dollar string or float to integer cents."""
    if val is None:
        return 0
    s = str(val).strip().replace(",", "").replace("$", "").replace("(", "-").replace(")", "")
    try:
        f = float(s)
        return int(round(f * 100))
    except ValueError:
        return 0


def parse_date(s: str) -> str:
    """Try common date formats and return YYYY-MM-DD."""
    for fmt in ("%m/%d/%Y", "%Y-%m-%d", "%m/%d/%y", "%B %d, %Y"):
        try:
            return datetime.strptime(s.strip(), fmt).strftime("%Y-%m-%d")
        except ValueError:
            pass
    # Try regex: find mm/dd/yyyy anywhere in string
    m = re.search(r"(\d{1,2}/\d{1,2}/\d{2,4})", s)
    if m:
        for fmt in ("%m/%d/%Y", "%m/%d/%y"):
            try:
                return datetime.strptime(m.group(1), fmt).strftime("%Y-%m-%d")
            except ValueError:
                pass
    return s.strip()


RETIREMENT_KEYWORDS = re.compile(r"401\s*k|retirement|roth|403\s*b|pension", re.IGNORECASE)


def find_in_header(row: list, *keywords: str) -> int | None:
    """Return index of first column whose header contains any keyword."""
    for i, cell in enumerate(row):
        if cell and any(kw.lower() in str(cell).lower() for kw in keywords):
            return i
    return None


def parse_pdf(path: str) -> dict:
    result = {
        "pay_date": None,
        "gross_cents": 0,
        "taxes_cents": 0,
        "retirement_cents": 0,
        "other_deductions_cents": 0,
        "net_cents": 0,
    }

    with pdfplumber.open(path) as pdf:
        all_tables = []
        all_text = []
        for page in pdf.pages:
            tables = page.extract_tables() or []
            all_tables.extend(tables)
            all_text.append(page.extract_text() or "")

    full_text = "\n".join(all_text)

    for table in all_tables:
        if not table or len(table) < 2:
            continue

        header = [str(c).strip() if c else "" for c in table[0]]
        header_str = " ".join(header).lower()

        # ── Pay date ──────────────────────────────────────────────────────────
        if "check date" in header_str or "pay date" in header_str or "pay period" in header_str:
            date_col = find_in_header(header, "check date", "pay date", "period end")
            if date_col is not None and len(table) > 1:
                val = table[1][date_col]
                if val:
                    result["pay_date"] = parse_date(str(val))

        # ── Summary totals ────────────────────────────────────────────────────
        if "gross" in header_str:
            data = table[1] if len(table) > 1 else []
            gross_col   = find_in_header(header, "gross")
            pre_col     = find_in_header(header, "pre tax", "pre-tax")
            stat_col    = find_in_header(header, "statutory", "taxes")
            post_col    = find_in_header(header, "post tax", "post-tax")
            net_col     = find_in_header(header, "net pay", "net")

            if gross_col is not None and net_col is not None and data:
                result["gross_cents"] = to_cents(data[gross_col])
                result["net_cents"]   = to_cents(data[net_col])
                if stat_col is not None:
                    result["taxes_cents"] = to_cents(data[stat_col])
                pre_total = to_cents(data[pre_col]) if pre_col is not None else 0
                post_total = to_cents(data[post_col]) if post_col is not None else 0
                # will refine retirement below; for now bucket into other
                result["other_deductions_cents"] = pre_total + post_total

        # ── Look for retirement in any table row ──────────────────────────────
        # Tables like: ['401k', '', '5%', '$200.00']
        for row in table[1:]:
            cells = [str(c).strip() if c else "" for c in row]
            row_str = " ".join(cells)
            if RETIREMENT_KEYWORDS.search(row_str):
                # Find the dollar amount in the row (rightmost numeric-looking cell)
                for cell in reversed(cells):
                    cents = to_cents(cell)
                    if cents > 0:
                        result["retirement_cents"] = cents
                        # Remove from other_deductions since we identified it
                        result["other_deductions_cents"] = max(
                            0, result["other_deductions_cents"] - cents
                        )
                        break

    # ── Fallback: parse pay date from raw text if still missing ───────────────
    if not result["pay_date"]:
        for pattern in [
            r"(?:Check Date|Pay Date)[:\s]+(\d{1,2}/\d{1,2}/\d{2,4})",
            r"(?:Period End)[:\s]+(\d{1,2}/\d{1,2}/\d{2,4})",
            r"(\d{2}/\d{2}/\d{4})",
        ]:
            m = re.search(pattern, full_text, re.IGNORECASE)
            if m:
                result["pay_date"] = parse_date(m.group(1))
                break

    if not result["pay_date"]:
        result["pay_date"] = datetime.now().strftime("%Y-%m-%d")

    return result


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: pay_parser.py <pdf_path>"}))
        sys.exit(1)
    try:
        data = parse_pdf(sys.argv[1])
        print(json.dumps(data))
    except Exception as e:
        sys.stderr.write(f"ERROR: {e}\n")
        sys.exit(1)
