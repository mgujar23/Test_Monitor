# Performance Evaluation Report Design

**Date:** July 20, 2026  
**Author:** Claude Code  
**Status:** Design Approved  
**Goal:** Create monthly HTML-based performance reports for team members tracking JIRA contributions and code review activities for performance evaluation purposes.

---

## 1. Overview

### Purpose
Generate professional HTML reports that evaluate individual team member performance based on:
- JIRA work contributions (features/EPICs, story points)
- Code review participation (number of reviews, feedback quality)
- Trends and historical comparisons

### Approach
**Approach 2: HTML Template with Data Population**
- Python or Node.js script pulls data from JIRA and Perforce Swarm APIs
- Script populates pre-made HTML templates with data
- Generates two report types: consolidated team view + individual reports
- Reports are static HTML files, print-friendly, shareable

### Frequency
Monthly generation (1st of each month or on-demand)

### Scope
- Track specific team members (user-provided list)
- Monthly time periods (1st to last day of month)
- Light theme, corporate visual style

---

## 2. Report Structure

### 2.1 Consolidated Report
**File:** `team-performance-[YYYY-MM].html`

**Purpose:** Manager view of all team members' contributions in one place

**Layout:**
- Responsive grid of team member cards (4 columns on desktop, responsive on mobile)
- Each card is clickable to view individual detailed report

**Components:**

#### Header Section
- Report title: "Team Performance Report - [Month Year]"
- Date range displayed
- Last updated timestamp
- Print/Export to PDF button

#### Team Member Cards (Grid Layout)
Each card displays:
- Team member name
- Profile indicator/avatar placeholder
- **4 Key Metrics (in priority order):**
  1. 📌 **Features/EPICs** - Number of features/epics worked on (large number)
  2. 👁️ **Code Reviews** - Number of code reviews conducted (large number)
  3. 💬 **Feedback Quality** - Quality score 1-5 with visual indicator (stars/bars)
  4. ⭐ **Story Points** - Total story points completed (large number)
- Month-over-month trend indicator (↑ ↓ →) for each metric
- "View Detailed Report" link to individual report

#### Optional Features
- Sort/filter by team member name or metric
- Search functionality

---

### 2.2 Individual Reports
**File:** `performance-[name]-[YYYY-MM].html`

**Purpose:** Detailed performance evaluation for 1:1 discussions and formal reviews

**Layout:**
- Single-page report with multiple sections
- Print-friendly (page breaks optimized)

**Sections:**

#### 1. Summary Header
- Team member name and date
- Overall performance summary (e.g., "Excellent contributor", "On track", "Needs support")
- Quick stats banner showing this month's numbers

#### 2. Key Metrics Dashboard
- 4 large stat cards (one for each primary metric)
- Each card shows:
  - Current month value
  - Previous month value for comparison
  - Trend indicator (↑ +X%, ↓ -X%, → No change)
  - Visual progress bar or indicator

**Metrics:**
1. Features/EPICs worked on
2. Code reviews conducted
3. Comments/feedback quality score
4. Story points completed

#### 3. Features/EPICs Breakdown Section
**Table showing all features/epics worked on:**

| Feature/Epic Name | Story Points | Role | Status | Completion % |
|---|---|---|---|---|
| User Authentication | 13 | Developer | Completed | 100% |
| API Rate Limiting | 8 | Developer | In Progress | 75% |
| Dashboard Redesign | 5 | Code Reviewer | Completed | 100% |

- Sortable by: name, points, status
- Shows contribution type (developer, reviewer, both)

#### 4. Code Review Contributions Section
**Subsection 4a: Review Statistics Table**

| Metric | Value | vs Last Month | Status |
|---|---|---|---|
| Reviews Conducted | 28 | +3 | ↑ Good |
| Files Reviewed | 156 | +20 | ↑ |
| Lines of Code Reviewed | 3,247 | +400 | ↑ |
| Avg Review Turnaround | 4.2 hours | -0.8 | ↑ Faster |
| Avg Comments per Review | 3.5 | +0.5 | ↑ More thorough |

**Subsection 4b: Review Quality Analysis**
- Comments/feedback count breakdown
- Sample comments (2-3 examples showing quality feedback)
- Quality score: 1-5 stars with explanation
- Chart: Review activity trend (line graph showing reviews per week across the month)

#### 5. Historical Comparison Section
**3-Month Trend Table:**

| Metric | Current Month | Last Month | 2 Months Ago | Trend |
|---|---|---|---|---|
| Features/EPICs | 4 | 3 | 5 | ↓ |
| Code Reviews | 28 | 25 | 22 | ↑ |
| Feedback Quality | 4.2/5 | 3.9/5 | 3.7/5 | ↑ |
| Story Points | 34 | 28 | 42 | ↓ |

- Shows 3-month trajectory for performance evaluation context
- Highlights improvement areas and consistent performance

#### 6. Footer
- Report generated timestamp
- Data sources (JIRA, Perforce Swarm)
- Print/PDF export button
- Data disclaimer (e.g., "Data based on JIRA and Swarm records as of [date]")

---

## 3. Data Sources & Metrics Calculation

### 3.1 JIRA Data Mapping

**Features/EPICs Worked On:**
- Source: JIRA Issues
- Filter: Assignee = team member, Issue Type = "Epic" OR "Feature" OR labeled "Feature"
- Time Range: Assigned/completed during the month
- Count: Number of unique features/epics

**Story Points Completed:**
- Source: JIRA Issues
- Filter: Assignee = team member, Status = "Done", Completed during the month
- Calculation: Sum of `story_points` field
- Exclude: Unestimated items (0 points)

### 3.2 Perforce Swarm Data Mapping

**Code Reviews Conducted:**
- Source: Perforce Swarm Reviews
- Filter: Reviewer = team member, Review created during the month
- Count: Number of reviews where person is listed as reviewer

**Files Reviewed:**
- Source: Each review's file list
- Filter: Same as above
- Count: Sum of files across all reviews

**Lines of Code Reviewed:**
- Source: Each review's line count
- Calculation: Sum of lines changed across all reviewed files

**Average Review Turnaround:**
- Calculation: Average time from review submission to approval/completion
- Formula: (Completion Time - Submission Time) averaged across all reviews

**Comments/Feedback Quality:**
- Feedback Count: Total comments/feedback given in reviews
- Quality Score: Calculated as:
  - Number of comments weighted by length/depth
  - If comments > 3 per review = higher quality score
  - Scale: 1-5 stars where 5 = excellent feedback
  - Formula: `min(5, 1 + (avg_comments_per_review / 2))`

### 3.3 Trend Calculation

**Month-over-Month Comparison:**
- Previous month = same calendar month in the previous month
- Percentage change = `((Current - Previous) / Previous) * 100`
- Trend indicator:
  - ↑ = Improvement (positive for most metrics)
  - ↓ = Decline
  - → = No significant change (< 5% variance)

---

## 4. Visual Design

### 4.1 Color Palette (Light Theme, Corporate)

| Element | Color | Hex Code | Usage |
|---|---|---|---|
| Background | Light Gray | #F5F5F5 | Page background |
| Card Background | White | #FFFFFF | Card/section backgrounds |
| Primary Accent | Professional Blue | #2E5C8A | Headers, buttons, links |
| Success/Positive Trend | Teal | #1B8B7B | Positive indicators (↑) |
| Neutral/No Change | Gray | #888888 | Neutral trends (→) |
| Text (Primary) | Dark Gray | #333333 | Main body text |
| Text (Secondary) | Medium Gray | #666666 | Secondary text |
| Borders | Light Gray | #DDDDDD | Card/section borders |

### 4.2 Typography

**Font Family:** System sans-serif stack (Arial, Segoe UI, Helvetica, sans-serif)

**Font Sizes:**
- Page Title: 32px, bold
- Section Header: 18px, bold
- Subheader: 14px, semi-bold
- Body Text: 14px, regular
- Metric Value: 24px, bold
- Table Text: 13px, regular
- Footer: 12px, regular

### 4.3 Layout & Spacing

**Consolidated Report:**
- Header: 60px padding
- Card grid: 4 columns on desktop, 2 on tablet, 1 on mobile
- Card size: ~250px × 280px
- Gap between cards: 20px
- Maximum width: 1400px (centered)

**Individual Report:**
- Sections: 40px padding between sections
- Section width: 900px (centered) or full-width (responsive)
- Table padding: 15px
- Print page breaks after each major section

### 4.4 Chart Design

**Technologies:** Use Chart.js (lightweight, no build dependency)

**Chart Types:**
- Line chart: Review activity trend (weekly data)
- Bar chart: Metric comparisons (current vs previous months)
- Simple, minimal styling (no fancy animations)

---

## 5. Technical Implementation

### 5.1 Script Architecture

**Language Options:**
- Python (recommended if using Jira Python library)
- Node.js (recommended if using existing Node setup)

**Workflow:**
1. Load configuration (team members list, API credentials)
2. Authenticate to JIRA API
3. Authenticate to Perforce Swarm API
4. For each team member:
   - Fetch JIRA data (features, story points, issues)
   - Fetch Perforce data (reviews, comments, files)
   - Calculate metrics and trends
   - Generate individual HTML report
5. Aggregate data for consolidated report
6. Generate consolidated HTML report
7. Output success message with file locations

### 5.2 HTML Templates

**Two template files:**
1. `consolidated-template.html` - Consolidated report template with placeholder variables
2. `individual-template.html` - Individual report template with placeholder variables

**Template Variables (examples):**
- `{REPORT_DATE}` - July 2026
- `{TEAM_MEMBER_NAME}` - John Doe
- `{FEATURES_COUNT}` - 4
- `{REVIEWS_COUNT}` - 28
- `{FEEDBACK_QUALITY}` - 4.2
- `{STORY_POINTS}` - 34
- `{FEATURES_TABLE}` - HTML table of features
- `{REVIEW_CHART_DATA}` - JSON for chart.js
- `{TREND_INDICATOR}` - ↑ or ↓ or →

### 5.3 Configuration File

**Format:** JSON or YAML

**Contents:**
```json
{
  "report_month": "2026-07",
  "jira": {
    "baseUrl": "https://jira.example.com",
    "apiToken": "xxx",
    "projectKey": "CSG"
  },
  "perforce": {
    "swarmUrl": "https://swarm.perforce.example.com",
    "apiToken": "xxx"
  },
  "team_members": [
    {
      "name": "John Doe",
      "jira_id": "john.doe",
      "swarm_id": "john_doe"
    },
    {
      "name": "Jane Smith",
      "jira_id": "jane.smith",
      "swarm_id": "jane_smith"
    }
  ],
  "output_dir": "./reports"
}
```

### 5.4 Deliverables

**Files to create:**
1. `report-generator.py` or `report-generator.js` - Main script
2. `consolidated-template.html` - HTML template for team view
3. `individual-template.html` - HTML template for individual reports
4. `config.json.example` - Example configuration
5. `README.md` - Setup and usage instructions
6. `.gitignore` - Exclude credentials, reports folder

---

## 6. Success Criteria

✅ Reports generate monthly without manual effort (or one-click trigger)  
✅ Consolidated report shows all team members with 4 key metrics  
✅ Individual reports show detailed breakdown with 3-month trends  
✅ Reports are print-friendly and look professional in PDF  
✅ Light theme, corporate styling matches requirements  
✅ Data sources (JIRA + Perforce) integrate correctly  
✅ Configuration file allows easy team member list updates  
✅ No database required (static HTML output)  

---

## 7. Future Enhancements (Out of Scope)

- Email automation (send reports monthly to managers)
- Web dashboard for interactive viewing
- Additional metrics (deployment frequency, code quality scores)
- Export to Excel/CSV
- Automated performance ratings (AI-driven)
- Manager notes/comments on reports

---

## Notes

- Reports are static HTML files; they can be stored, versioned, and archived easily
- No server needed; reports can be shared via email, shared drives, or git
- Templates separate from logic for easy design updates
- Configuration-driven (team members list, API credentials in config file)
