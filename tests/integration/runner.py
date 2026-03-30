"""
HRMS HTTP Integration Test Runner
----------------------------------
Runs real HTTP requests against the live stack through NGINX.

Prerequisites:
    1. docker compose up --build
    2. python tests/seed.py
    3. set HRMS_TOKEN=<token from seed output>   (Windows)
       export HRMS_TOKEN=<token>                 (Linux/Mac)

Usage (run from project root):
    call tests\.venv\Scripts\activate.bat
    python -m tests.integration.runner
"""

import sys
import os
import time
from colorama import init, Fore, Style

init(autoreset=True, convert=True)

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from tests.integration import test_ems, test_pms, test_lms

SUITES = [
    ("Employee Management Service (EMS)", test_ems.TESTS),
    ("Payroll Management Service (PMS)", test_pms.TESTS),
    ("Leave Management Service (LMS)", test_lms.TESTS),
]


def run_suite(suite_name, tests):
    print(f"\n{Fore.YELLOW}{'─' * 60}")
    print(f"  {suite_name}")
    print(f"{'─' * 60}{Style.RESET_ALL}")

    passed = 0
    failed = 0
    failures = []

    for test_fn in tests:
        name = test_fn.__name__.replace("test_", "").replace("_", " ")
        try:
            test_fn()
            print(f"  {Fore.GREEN}[PASS]{Style.RESET_ALL} {name}")
            passed += 1
        except AssertionError as e:
            print(f"  {Fore.RED}[FAIL]{Style.RESET_ALL} {name}")
            print(f"    {Fore.RED}{e}{Style.RESET_ALL}")
            failed += 1
            failures.append((name, str(e)))
        except Exception as e:
            print(f"  {Fore.RED}[FAIL]{Style.RESET_ALL} {name}")
            print(f"    {Fore.RED}Unexpected error: {e}{Style.RESET_ALL}")
            failed += 1
            failures.append((name, str(e)))

    return passed, failed, failures


def main():
    if not os.getenv("HRMS_TOKEN"):
        print(f"{Fore.RED}Error: HRMS_TOKEN environment variable is not set.")
        print(
            f"Run 'python tests/seed.py' first and export the token.{Style.RESET_ALL}"
        )
        sys.exit(1)

    print(f"\n{Fore.CYAN}{'=' * 60}")
    print("  HRMS HTTP Integration Test Runner")
    print(f"  Base URL: {os.getenv('HRMS_BASE_URL', 'http://localhost')}")
    print(f"{'=' * 60}{Style.RESET_ALL}")

    start = time.time()
    total_passed = 0
    total_failed = 0
    all_failures = []

    for i, (suite_name, tests) in enumerate(SUITES):
        passed, failed, failures = run_suite(suite_name, tests)
        total_passed += passed
        total_failed += failed
        all_failures.extend([(suite_name, name, err) for name, err in failures])

        # After EMS suite, wait for RabbitMQ events to propagate to PMS and LMS caches
        if i == 0 and i < len(SUITES) - 1:
            wait = 10
            print(
                f"\n{Fore.CYAN}Waiting {wait}s for RabbitMQ events to propagate...{Style.RESET_ALL}"
            )
            time.sleep(wait)

    elapsed = time.time() - start

    print(f"\n{Fore.YELLOW}{'=' * 60}")
    print("  Summary")
    print(f"{'=' * 60}{Style.RESET_ALL}")
    print(f"  Total:  {total_passed + total_failed}")
    print(f"  {Fore.GREEN}Passed: {total_passed}{Style.RESET_ALL}")
    print(f"  {Fore.RED}Failed: {total_failed}{Style.RESET_ALL}")
    print(f"  Time:   {elapsed:.2f}s")

    if all_failures:
        print(f"\n{Fore.RED}Failed Tests:{Style.RESET_ALL}")
        for suite, name, err in all_failures:
            print(f"  [{suite}] {name}")
            print(f"    {err}")

    print()
    sys.exit(1 if total_failed > 0 else 0)


if __name__ == "__main__":
    main()
