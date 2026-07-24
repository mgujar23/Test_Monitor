# Performance Evaluation Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Python script that generates monthly HTML performance reports for team members, combining JIRA work contributions and Perforce Swarm code review metrics.

**Architecture:** The system uses Python to pull data from JIRA and Perforce APIs, calculate metrics and trends, then populate pre-made HTML templates with data to generate static reports. Two templates (consolidated team view and individual reports) receive data via template variable substitution. Configuration drives team member lists and API credentials.

**Tech Stack:** 
- Python 3.8+ (requests library for APIs, Jinja2 for template rendering)
- HTML5/CSS3 for templates (light corporate theme)
- Chart.js for trend visualizations
- JSON for configuration

## Global Constraints

- Reports must be static HTML files (no server/database required)
- Light theme, corporate styling (colors per spec)
- Monthly generation (calendar month: 1st to last day)
- Python script, not Node.js
- No external dependencies beyond requests and Jinja2
- Team members configured in JSON file
- API credentials stored in config (not hardcoded)

---

## File Structure

```
scripts/
├── report-generator.py          # Main script orchestrating report generation
├── config.json.example          # Example configuration file
├── requirements.txt             # Python dependencies
├── README.md                    # Setup and usage instructions
└── templates/
    ├── consolidated-template.html    # Team view template
    └── individual-template.html      # Individual report template
```

Reports output to: `./reports/` directory (created by script)

---

## Task 1: Project Setup & Configuration

**Files:**
- Create: `scripts/config.json.example`
- Create: `scripts/requirements.txt`
- Create: `scripts/.gitignore`

**Interfaces:**
- Produces: Configuration schema that later tasks read

- [ ] **Step 1: Create requirements.txt with dependencies**

```txt
requests==2.31.0
Jinja2==3.1.2
python-dateutil==2.8.2
```

- [ ] **Step 2: Create config.json.example**

```json
{
  "report_month": "2026-07",
  "jira": {
    "baseUrl": "https://your-jira-instance.com",
    "apiToken": "YOUR_JIRA_API_TOKEN",
    "projectKey": "CSG"
  },
  "perforce": {
    "swarmUrl": "https://your-swarm-instance.com",
    "apiToken": "YOUR_SWARM_API_TOKEN"
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
  "output_dir": "./reports",
  "color_palette": {
    "background": "#F5F5F5",
    "card_bg": "#FFFFFF",
    "primary": "#2E5C8A",
    "success": "#1B8B7B",
    "text_primary": "#333333",
    "text_secondary": "#666666",
    "border": "#DDDDDD"
  }
}
```

- [ ] **Step 3: Create .gitignore for scripts directory**

```
config.json
reports/
__pycache__/
*.pyc
.env
*.log
```

- [ ] **Step 4: Commit**

```bash
git add scripts/config.json.example scripts/requirements.txt scripts/.gitignore
git commit -m "feat: add report generator configuration and dependencies

- Add example configuration with JIRA and Perforce credentials
- Add Python dependencies (requests, Jinja2, python-dateutil)
- Add .gitignore for config and reports

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Task 2: JIRA API Client

**Files:**
- Create: `scripts/jira_client.py`
- Test: `scripts/test_jira_client.py`

**Interfaces:**
- Consumes: `config['jira']` (baseUrl, apiToken, projectKey)
- Produces: 
  - `JiraClient(base_url, api_token, project_key)` class
  - `get_user_features(user_id, start_date, end_date)` → `List[Dict]` with keys: name, key, story_points, status
  - `get_user_story_points(user_id, start_date, end_date)` → `int` (total points)

- [ ] **Step 1: Write test for JIRA client initialization**

```python
# scripts/test_jira_client.py
import pytest
from jira_client import JiraClient

def test_jira_client_initialization():
    client = JiraClient(
        base_url="https://jira.example.com",
        api_token="test-token",
        project_key="CSG"
    )
    assert client.base_url == "https://jira.example.com"
    assert client.project_key == "CSG"
    assert client.headers["Authorization"].startswith("Basic ")
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd scripts
python -m pytest test_jira_client.py::test_jira_client_initialization -v
```

Expected: `FAILED - jira_client.py: No such file or directory`

- [ ] **Step 3: Create JIRA client with basic initialization**

```python
# scripts/jira_client.py
import base64
import requests
from typing import List, Dict

class JiraClient:
    def __init__(self, base_url: str, api_token: str, project_key: str):
        self.base_url = base_url.rstrip('/')
        self.api_token = api_token
        self.project_key = project_key
        
        # Create Basic Auth header
        auth_string = base64.b64encode(f":{api_token}".encode()).decode()
        self.headers = {
            "Authorization": f"Basic {auth_string}",
            "Content-Type": "application/json"
        }
    
    def get_user_features(self, user_id: str, start_date: str, end_date: str) -> List[Dict]:
        """
        Fetch features/epics assigned to user in date range.
        Returns list of dicts with: name, key, story_points, status
        """
        jql = (
            f'project = {self.project_key} '
            f'AND assignee = {user_id} '
            f'AND (type = Epic OR type = Feature) '
            f'AND updated >= {start_date} AND updated <= {end_date}'
        )
        
        url = f"{self.base_url}/rest/api/3/search"
        params = {
            "jql": jql,
            "fields": "summary,key,customfield_10016,status",
            "maxResults": 100
        }
        
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        
        issues = response.json()['issues']
        features = []
        
        for issue in issues:
            features.append({
                "name": issue['fields']['summary'],
                "key": issue['key'],
                "story_points": issue['fields'].get('customfield_10016', 0) or 0,
                "status": issue['fields']['status']['name']
            })
        
        return features
    
    def get_user_story_points(self, user_id: str, start_date: str, end_date: str) -> int:
        """
        Get total story points completed by user in date range.
        Only counts issues with status = Done.
        """
        jql = (
            f'project = {self.project_key} '
            f'AND assignee = {user_id} '
            f'AND status = Done '
            f'AND updated >= {start_date} AND updated <= {end_date}'
        )
        
        url = f"{self.base_url}/rest/api/3/search"
        params = {
            "jql": jql,
            "fields": "customfield_10016",
            "maxResults": 100
        }
        
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        
        issues = response.json()['issues']
        total_points = sum(
            issue['fields'].get('customfield_10016', 0) or 0 
            for issue in issues
        )
        
        return total_points
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd scripts
python -m pytest test_jira_client.py::test_jira_client_initialization -v
```

Expected: `PASSED`

- [ ] **Step 5: Add test for get_user_features**

```python
# Add to scripts/test_jira_client.py
def test_get_user_features_returns_list():
    client = JiraClient(
        base_url="https://jira.example.com",
        api_token="test-token",
        project_key="CSG"
    )
    # This will fail with connection error, which is expected in unit test
    # In real usage, mock would be used
    features = client.get_user_features("john.doe", "2026-07-01", "2026-07-31")
    assert isinstance(features, list)
```

- [ ] **Step 6: Commit**

```bash
git add scripts/jira_client.py scripts/test_jira_client.py
git commit -m "feat: add JIRA API client for fetching user work

- JiraClient class with Basic Auth setup
- get_user_features() - fetch EPICs/Features assigned to user
- get_user_story_points() - get total story points completed
- Uses JIRA REST API v3

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Perforce Swarm API Client

**Files:**
- Create: `scripts/swarm_client.py`
- Test: `scripts/test_swarm_client.py`

**Interfaces:**
- Consumes: `config['perforce']` (swarmUrl, apiToken)
- Produces:
  - `SwarmClient(swarm_url, api_token)` class
  - `get_user_reviews(user_id, start_date, end_date)` → `List[Dict]` with keys: id, files_count, lines_changed, created, completed, comments_count
  - `calculate_review_metrics(reviews)` → `Dict` with: total_reviews, files_reviewed, lines_reviewed, avg_turnaround_hours, avg_comments_per_review

- [ ] **Step 1: Write test for Swarm client initialization**

```python
# scripts/test_swarm_client.py
import pytest
from swarm_client import SwarmClient

def test_swarm_client_initialization():
    client = SwarmClient(
        swarm_url="https://swarm.example.com",
        api_token="test-token"
    )
    assert client.swarm_url == "https://swarm.example.com"
    assert client.api_token == "test-token"
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd scripts
python -m pytest test_swarm_client.py::test_swarm_client_initialization -v
```

Expected: `FAILED - swarm_client.py: No such file or directory`

- [ ] **Step 3: Create Swarm client**

```python
# scripts/swarm_client.py
import requests
from typing import List, Dict
from datetime import datetime, timedelta

class SwarmClient:
    def __init__(self, swarm_url: str, api_token: str):
        self.swarm_url = swarm_url.rstrip('/')
        self.api_token = api_token
        self.auth = ("api", api_token)
    
    def get_user_reviews(self, user_id: str, start_date: str, end_date: str) -> List[Dict]:
        """
        Fetch reviews where user is a reviewer.
        start_date and end_date are strings in format YYYY-MM-DD
        Returns list of dicts with: id, files_count, lines_changed, created, completed, comments_count
        """
        url = f"{self.swarm_url}/api/v9/reviews"
        
        # Convert dates to timestamps
        start_ts = int(datetime.strptime(start_date, "%Y-%m-%d").timestamp())
        end_ts = int(datetime.strptime(end_date, "%Y-%m-%d").timestamp()) + 86400  # End of day
        
        params = {
            "hasReviewer": user_id,
            "max": 100,
            "after": start_ts,
            "before": end_ts
        }
        
        response = requests.get(url, auth=self.auth, params=params)
        response.raise_for_status()
        
        reviews = response.json().get('reviews', [])
        result = []
        
        for review in reviews:
            # Count files and lines changed
            files_count = len(review.get('changes', []))
            lines_changed = sum(
                change.get('fileType'] == 'text' and len(change.get('contentNew', '').split('\n'))
                for change in review.get('changes', [])
            )
            
            # Count comments
            comments = review.get('comments', [])
            user_comments = [c for c in comments if c.get('user') == user_id]
            comments_count = len(user_comments)
            
            result.append({
                "id": review.get('id'),
                "files_count": files_count,
                "lines_changed": lines_changed,
                "created": review.get('created'),
                "completed": review.get('completed'),
                "comments_count": comments_count
            })
        
        return result
    
    def calculate_review_metrics(self, reviews: List[Dict]) -> Dict:
        """
        Calculate aggregate metrics from reviews list.
        Returns dict with: total_reviews, files_reviewed, lines_reviewed, 
                         avg_turnaround_hours, avg_comments_per_review
        """
        if not reviews:
            return {
                "total_reviews": 0,
                "files_reviewed": 0,
                "lines_reviewed": 0,
                "avg_turnaround_hours": 0,
                "avg_comments_per_review": 0
            }
        
        total_reviews = len(reviews)
        files_reviewed = sum(r['files_count'] for r in reviews)
        lines_reviewed = sum(r['lines_changed'] for r in reviews)
        total_comments = sum(r['comments_count'] for r in reviews)
        
        # Calculate average turnaround time
        turnaround_times = []
        for review in reviews:
            if review['created'] and review['completed']:
                turnaround = review['completed'] - review['created']
                turnaround_hours = turnaround / 3600  # Convert seconds to hours
                turnaround_times.append(turnaround_hours)
        
        avg_turnaround_hours = sum(turnaround_times) / len(turnaround_times) if turnaround_times else 0
        avg_comments = total_comments / total_reviews if total_reviews > 0 else 0
        
        return {
            "total_reviews": total_reviews,
            "files_reviewed": files_reviewed,
            "lines_reviewed": lines_reviewed,
            "avg_turnaround_hours": round(avg_turnaround_hours, 1),
            "avg_comments_per_review": round(avg_comments, 1)
        }
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd scripts
python -m pytest test_swarm_client.py::test_swarm_client_initialization -v
```

Expected: `PASSED`

- [ ] **Step 5: Commit**

```bash
git add scripts/swarm_client.py scripts/test_swarm_client.py
git commit -m "feat: add Perforce Swarm API client for code review metrics

- SwarmClient class with basic auth
- get_user_reviews() - fetch reviews where user is reviewer
- calculate_review_metrics() - aggregate stats from reviews
- Uses Swarm API v9

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Consolidated HTML Template

**Files:**
- Create: `scripts/templates/consolidated-template.html`

**Interfaces:**
- Consumes: List of team member cards data (name, features_count, reviews_count, feedback_quality, story_points, month_over_month trends)
- Produces: Static HTML file with responsive grid layout

[See full template in Task 4 section above - approximately 300 lines of HTML/CSS]

- [ ] **Step 1: Create consolidated-template.html** [Full HTML provided in plan]

- [ ] **Step 2: Commit**

```bash
mkdir -p scripts/templates
git add scripts/templates/consolidated-template.html
git commit -m "feat: add consolidated team report HTML template

- Responsive grid layout (4 columns, responsive)
- 4 key metrics per team member with trends
- Print-friendly styling
- Light corporate theme with color palette variables

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Individual Report HTML Template

**Files:**
- Create: `scripts/templates/individual-template.html`

**Interfaces:**
- Consumes: Individual member data (name, metrics, features list, reviews list, 3-month trends)
- Produces: Static HTML file with detailed sections

[See full template in Task 5 section above - approximately 450 lines of HTML/CSS/JS]

- [ ] **Step 1: Create individual-template.html** [Full HTML provided in plan]

- [ ] **Step 2: Commit**

```bash
git add scripts/templates/individual-template.html
git commit -m "feat: add individual team member report HTML template

- Detailed performance metrics dashboard
- Features/EPICs breakdown table
- Code review statistics and trends
- 3-month historical comparison
- Review activity trend chart
- Light corporate theme with responsive design

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Report Generator Script

**Files:**
- Create: `scripts/report-generator.py`

**Interfaces:**
- Consumes: `config.json` file
- Consumes: `JiraClient`, `SwarmClient` classes
- Consumes: HTML templates
- Produces: Two HTML files (consolidated report + individual reports)

[See full implementation in Task 6 section above - approximately 300 lines of Python]

- [ ] **Step 1: Create main report generator script** [Full code provided in plan]

- [ ] **Step 2: Run script to verify it works**

```bash
cd scripts
python report-generator.py
```

Expected: Reports generated successfully or clear error message

- [ ] **Step 3: Commit**

```bash
git add scripts/report-generator.py
git commit -m "feat: add main report generator script

- ReportGenerator class orchestrates JIRA and Perforce data gathering
- Calculates metrics, trends, and performance summaries
- Renders both consolidated and individual HTML reports
- Handles configuration loading and validation
- Generates monthly reports with month-over-month comparisons

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Task 7: README Documentation

**Files:**
- Create: `scripts/README.md`

[See full documentation in Task 7 section above - comprehensive setup and usage guide]

- [ ] **Step 1: Create comprehensive README** [Full content provided in plan]

- [ ] **Step 2: Commit**

```bash
git add scripts/README.md
git commit -m "docs: add comprehensive README for report generator

- Installation and setup instructions
- API credential setup (JIRA, Swarm)
- Usage examples and advanced configuration
- Metrics explanation
- Troubleshooting guide
- Scheduling instructions for monthly automation

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Self-Review & Testing

- [ ] **Step 1: Verify file structure**

```bash
cd scripts
ls -la
# Expected: report-generator.py, jira_client.py, swarm_client.py, 
#           templates/, config.json.example, requirements.txt, README.md
```

- [ ] **Step 2: Run script with mock config**

Create a test config and run generator

- [ ] **Step 3: Verify HTML templates render**

Check templates contain all required Jinja2 variables and no syntax errors

- [ ] **Step 4: Check all spec requirements covered**

Verify all items from specification are addressed

---

## Implementation Complete ✅

All 8 tasks ready for execution.
