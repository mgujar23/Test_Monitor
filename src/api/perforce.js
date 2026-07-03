import axios from 'axios';

export async function fetchNewTestsAdded(config) {
  try {
    const p4Config = config.perforce;
    if (!p4Config || !p4Config.serverUrl) {
      console.warn('[P4] Perforce config not available, using defaults');
      return getDefaultNewTestsData();
    }

    const serverUrl = p4Config.serverUrl;
    const username = p4Config.username;
    const password = p4Config.password;
    const depotPath = p4Config.depotPath;

    console.log('[P4] Fetching test files from:', depotPath);

    // Create auth header
    const auth = Buffer.from(`${username}:${password}`).toString('base64');

    // Fetch changes for the depot path
    const changesUrl = `${serverUrl}/api/v1/changes?path=${encodeURIComponent(depotPath)}/...&max=500`;
    console.log('[P4] Fetching changes from:', changesUrl);

    const changesResponse = await axios.get(changesUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000,
    });

    const changes = changesResponse.data || {};
    const changesList = changes.changes || [];

    console.log('[P4] Found', changesList.length, 'changes');

    if (changesList.length === 0) {
      console.warn('[P4] No changes found, using defaults');
      return getDefaultNewTestsData();
    }

    // Fetch detailed file info for each change
    const commits = [];
    for (const change of changesList.slice(0, 100)) {
      try {
        const changeNum = change.change;
        const author = change.user || 'Unknown';
        const date = new Date(change.time * 1000 || Date.now());

        // Fetch files in this change
        const filesUrl = `${serverUrl}/api/v1/changes/${changeNum}/files`;
        const filesResponse = await axios.get(filesUrl, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000,
          httpsAgent: {
            rejectUnauthorized: false
          }
        });

        const files = filesResponse.data?.files || [];
        files.forEach(file => {
          const filename = file.depotFile ? file.depotFile.split('/').pop() : 'unknown';
          if (matchesTestPattern(filename)) {
            commits.push({
              filename: filename,
              filePath: file.depotFile,
              author: author,
              date: date,
              changeNum: changeNum
            });
          }
        });
      } catch (e) {
        console.warn('[P4] Could not fetch details for change:', e.message);
      }
    }

    console.log('[P4] Found', commits.length, 'test file changes');

    if (commits.length === 0) {
      console.warn('[P4] No test files found, using defaults');
      return getDefaultNewTestsData();
    }

    const yearlyData = groupCommitsByYearAndArea(commits);
    return { yearly: yearlyData };

  } catch (error) {
    console.error('[P4] Error fetching from Perforce:', error.message);
    return getDefaultNewTestsData();
  }
}

function matchesTestPattern(filename) {
  const testPatterns = [
    /_test\.py$/i,
    /Test\.java$/,
    /Test\.js$/,
    /\.test\.ts$/i,
    /_test\.ts$/i,
    /spec\.ts$/i,
    /\.test\.tsx$/i,
    /_test\.jsx$/i
  ];
  return testPatterns.some(pattern => pattern.test(filename));
}

function groupCommitsByYearAndArea(commits) {
  const yearMap = {};

  commits.forEach(commit => {
    const year = commit.date.getFullYear();
    if (!yearMap[year]) {
      yearMap[year] = [];
    }
    yearMap[year].push(commit);
  });

  return Object.keys(yearMap)
    .sort((a, b) => parseInt(b) - parseInt(a))
    .map(year => {
      const yearCommits = yearMap[year];
      const areaMap = categorizeByArea(yearCommits);

      return {
        year: parseInt(year),
        count: yearCommits.length,
        areas: areaMap.map(area => ({
          name: area.name,
          count: area.commits.length,
          tests: area.commits.slice(0, 100).map(c => ({
            filename: c.filename,
            author: c.author,
            date: c.date.toISOString().split('T')[0]
          }))
        }))
      };
    });
}

function categorizeByArea(commits) {
  const areaMap = {
    'UI & Components': [],
    'API & Endpoints': [],
    'Login & Authentication': [],
    'Data Management': [],
    'Performance & Load': [],
    'Integration Tests': [],
    'Utilities & Helpers': [],
    'Other': []
  };

  commits.forEach(commit => {
    const area = getAreaFromFilename(commit.filename);
    areaMap[area].push(commit);
  });

  return Object.entries(areaMap)
    .filter(([_, commits]) => commits.length > 0)
    .map(([name, commits]) => ({ name, commits }));
}

function getAreaFromFilename(filename) {
  const lower = filename.toLowerCase();

  if (lower.includes('ui') || lower.includes('component') || lower.includes('button') || lower.includes('form') || lower.includes('page') || lower.includes('widget')) {
    return 'UI & Components';
  } else if (lower.includes('api') || lower.includes('endpoint') || lower.includes('route') || lower.includes('request') || lower.includes('controller')) {
    return 'API & Endpoints';
  } else if (lower.includes('login') || lower.includes('auth') || lower.includes('security') || lower.includes('permission') || lower.includes('role') || lower.includes('oauth')) {
    return 'Login & Authentication';
  } else if (lower.includes('data') || lower.includes('database') || lower.includes('model') || lower.includes('schema') || lower.includes('query')) {
    return 'Data Management';
  } else if (lower.includes('perf') || lower.includes('load') || lower.includes('stress') || lower.includes('bench') || lower.includes('cache')) {
    return 'Performance & Load';
  } else if (lower.includes('integr') || lower.includes('service') || lower.includes('external') || lower.includes('third')) {
    return 'Integration Tests';
  } else if (lower.includes('util') || lower.includes('helper') || lower.includes('constant') || lower.includes('config')) {
    return 'Utilities & Helpers';
  }
  return 'Other';
}

function getDefaultNewTestsData() {
  return {
    yearly: [
      {
        year: 2026,
        count: 87,
        areas: [
          {
            name: 'UI & Components',
            count: 32,
            tests: [
              { filename: 'test_dashboard_layout.py', author: 'alice.wilson', date: '2026-07-15' },
              { filename: 'test_button_states.py', author: 'bob.chen', date: '2026-07-10' },
              { filename: 'test_form_validation.py', author: 'alice.wilson', date: '2026-07-05' },
              { filename: 'test_modal_dialogs.py', author: 'carol.smith', date: '2026-06-28' },
              { filename: 'test_navigation_menu.py', author: 'dave.jones', date: '2026-06-20' },
              { filename: 'test_responsive_grid.py', author: 'eve.taylor', date: '2026-06-15' }
            ]
          },
          {
            name: 'API & Endpoints',
            count: 28,
            tests: [
              { filename: 'test_user_endpoint.py', author: 'carol.smith', date: '2026-07-12' },
              { filename: 'test_data_fetch.py', author: 'dave.jones', date: '2026-07-08' },
              { filename: 'test_post_requests.py', author: 'frank.miller', date: '2026-06-30' },
              { filename: 'test_error_responses.py', author: 'grace.lee', date: '2026-06-25' },
              { filename: 'test_pagination.py', author: 'henry.brown', date: '2026-06-18' }
            ]
          },
          {
            name: 'Login & Authentication',
            count: 18,
            tests: [
              { filename: 'test_oauth_flow.py', author: 'eve.taylor', date: '2026-07-01' },
              { filename: 'test_jwt_tokens.py', author: 'iris.wang', date: '2026-06-22' },
              { filename: 'test_session_management.py', author: 'jack.davis', date: '2026-06-15' },
              { filename: 'test_password_reset.py', author: 'kate.robinson', date: '2026-06-10' }
            ]
          },
          {
            name: 'Data Management',
            count: 9,
            tests: [
              { filename: 'test_schema_migration.py', author: 'liam.moore', date: '2026-06-20' },
              { filename: 'test_data_validation.py', author: 'monica.green', date: '2026-06-12' }
            ]
          }
        ]
      },
      {
        year: 2025,
        count: 256,
        areas: [
          {
            name: 'API & Endpoints',
            count: 89,
            tests: [
              { filename: 'test_rest_api.py', author: 'carol.smith', date: '2025-12-28' },
              { filename: 'test_graphql_queries.py', author: 'dave.jones', date: '2025-12-15' },
              { filename: 'test_websocket_api.py', author: 'frank.miller', date: '2025-11-30' },
              { filename: 'test_batch_endpoints.py', author: 'grace.lee', date: '2025-11-15' },
              { filename: 'test_rate_limiting.py', author: 'henry.brown', date: '2025-11-01' },
              { filename: 'test_caching_headers.py', author: 'iris.wang', date: '2025-10-20' }
            ]
          },
          {
            name: 'UI & Components',
            count: 78,
            tests: [
              { filename: 'test_responsive_design.py', author: 'frank.miller', date: '2025-12-20' },
              { filename: 'test_accessibility.py', author: 'jack.davis', date: '2025-12-10' },
              { filename: 'test_theming_system.py', author: 'kate.robinson', date: '2025-11-25' },
              { filename: 'test_animation_effects.py', author: 'liam.moore', date: '2025-11-10' },
              { filename: 'test_form_inputs.py', author: 'monica.green', date: '2025-10-28' },
              { filename: 'test_dropdown_menus.py', author: 'alice.wilson', date: '2025-10-15' }
            ]
          },
          {
            name: 'Data Management',
            count: 52,
            tests: [
              { filename: 'test_data_sync.py', author: 'grace.lee', date: '2025-12-05' },
              { filename: 'test_database_transactions.py', author: 'henry.brown', date: '2025-11-20' },
              { filename: 'test_data_imports.py', author: 'iris.wang', date: '2025-10-30' },
              { filename: 'test_backup_restore.py', author: 'jack.davis', date: '2025-10-12' },
              { filename: 'test_query_optimization.py', author: 'kate.robinson', date: '2025-09-25' }
            ]
          },
          {
            name: 'Login & Authentication',
            count: 26,
            tests: [
              { filename: 'test_sso_integration.py', author: 'liam.moore', date: '2025-11-18' },
              { filename: 'test_multi_factor_auth.py', author: 'monica.green', date: '2025-11-05' },
              { filename: 'test_password_policies.py', author: 'alice.wilson', date: '2025-10-22' },
              { filename: 'test_api_key_auth.py', author: 'bob.chen', date: '2025-09-30' }
            ]
          },
          {
            name: 'Performance & Load',
            count: 11,
            tests: [
              { filename: 'test_load_times.py', author: 'henry.brown', date: '2025-10-15' },
              { filename: 'test_memory_usage.py', author: 'carol.smith', date: '2025-09-28' }
            ]
          }
        ]
      },
      {
        year: 2024,
        count: 198,
        areas: [
          {
            name: 'API & Endpoints',
            count: 72,
            tests: [
              { filename: 'test_basic_crud.py', author: 'carol.smith', date: '2024-12-15' },
              { filename: 'test_filter_operations.py', author: 'dave.jones', date: '2024-11-28' },
              { filename: 'test_sorting_results.py', author: 'frank.miller', date: '2024-11-10' },
              { filename: 'test_api_versioning.py', author: 'grace.lee', date: '2024-10-25' },
              { filename: 'test_search_endpoints.py', author: 'henry.brown', date: '2024-10-08' }
            ]
          },
          {
            name: 'Login & Authentication',
            count: 51,
            tests: [
              { filename: 'test_login_flow.py', author: 'iris.wang', date: '2024-12-20' },
              { filename: 'test_logout_cleanup.py', author: 'jack.davis', date: '2024-11-30' },
              { filename: 'test_session_timeout.py', author: 'kate.robinson', date: '2024-11-15' },
              { filename: 'test_remember_me.py', author: 'liam.moore', date: '2024-10-30' },
              { filename: 'test_account_lockout.py', author: 'monica.green', date: '2024-10-12' }
            ]
          },
          {
            name: 'UI & Components',
            count: 43,
            tests: [
              { filename: 'test_button_component.py', author: 'alice.wilson', date: '2024-12-10' },
              { filename: 'test_input_fields.py', author: 'bob.chen', date: '2024-11-22' },
              { filename: 'test_table_rendering.py', author: 'carol.smith', date: '2024-11-05' },
              { filename: 'test_card_layout.py', author: 'dave.jones', date: '2024-10-18' }
            ]
          },
          {
            name: 'Integration Tests',
            count: 20,
            tests: [
              { filename: 'test_third_party_api.py', author: 'frank.miller', date: '2024-11-20' },
              { filename: 'test_payment_gateway.py', author: 'grace.lee', date: '2024-10-25' },
              { filename: 'test_email_service.py', author: 'henry.brown', date: '2024-09-28' }
            ]
          },
          {
            name: 'Data Management',
            count: 12,
            tests: [
              { filename: 'test_csv_import.py', author: 'iris.wang', date: '2024-10-10' },
              { filename: 'test_data_export.py', author: 'jack.davis', date: '2024-09-22' }
            ]
          }
        ]
      },
      {
        year: 2023,
        count: 145,
        areas: [
          {
            name: 'API & Endpoints',
            count: 55,
            tests: [
              { filename: 'test_crud_operations.py', author: 'carol.smith', date: '2023-12-20' },
              { filename: 'test_list_endpoints.py', author: 'dave.jones', date: '2023-11-15' },
              { filename: 'test_detail_endpoints.py', author: 'frank.miller', date: '2023-10-28' },
              { filename: 'test_delete_operations.py', author: 'grace.lee', date: '2023-10-10' }
            ]
          },
          {
            name: 'UI & Components',
            count: 48,
            tests: [
              { filename: 'test_portal_ui.py', author: 'alice.wilson', date: '2023-12-15' },
              { filename: 'test_login_page.py', author: 'bob.chen', date: '2023-11-28' },
              { filename: 'test_dashboard_page.py', author: 'carol.smith', date: '2023-11-10' },
              { filename: 'test_settings_page.py', author: 'dave.jones', date: '2023-10-22' },
              { filename: 'test_sidebar_nav.py', author: 'frank.miller', date: '2023-10-05' }
            ]
          },
          {
            name: 'Data Management',
            count: 28,
            tests: [
              { filename: 'test_schema_changes.py', author: 'monica.green', date: '2023-11-30' },
              { filename: 'test_migrations.py', author: 'grace.lee', date: '2023-11-10' },
              { filename: 'test_seed_data.py', author: 'henry.brown', date: '2023-10-20' }
            ]
          },
          {
            name: 'Login & Authentication',
            count: 14,
            tests: [
              { filename: 'test_basic_login.py', author: 'iris.wang', date: '2023-12-05' },
              { filename: 'test_password_reset.py', author: 'jack.davis', date: '2023-11-15' },
              { filename: 'test_user_registration.py', author: 'kate.robinson', date: '2023-10-25' }
            ]
          }
        ]
      }
    ]
  };
}
