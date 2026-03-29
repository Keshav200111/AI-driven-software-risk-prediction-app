
# TODO: Server-side PDF Report

- [ ] Step 1: pip install jinja2 weasyprint in backend/venv
- [ ] Step 2: Create backend/templates/report.html Jinja template
- [ ] Step 3: Add /api/generate-report POST endpoint in backend/main.py (JSON -> HTML -> PDF bytes)
- [ ] Step 4: Update components/security-advisory.tsx to fetch POST /api/generate-report -> blob download
- [ ] Step 5: pnpm remove jspdf html2canvas; test full flow

