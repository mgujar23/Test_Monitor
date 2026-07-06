// Generate realistic diffs for failed test fixes
// Based on test type, generates meaningful code changes

export function generateTestFixDiff(testDetails) {
  const testName = testDetails.name || 'TestCase';
  const className = testDetails.className || 'TestClass';

  // Extract test type from name
  const testType = categorizeTest(testName, className);

  switch (testType) {
    case 'selenium':
      return generateSeleniumDiff(className, testName);
    case 'integration':
      return generateIntegrationDiff(className, testName);
    case 'unit':
      return generateUnitDiff(className, testName);
    case 'database':
      return generateDatabaseDiff(className, testName);
    case 'performance':
      return generatePerformanceDiff(className, testName);
    default:
      return generateGenericDiff(className, testName);
  }
}

function categorizeTest(testName, className) {
  if (testName.includes('Selenium') || testName.includes('UI') || testName.includes('Portal')) {
    return 'selenium';
  } else if (testName.includes('Integration') || testName.includes('API')) {
    return 'integration';
  } else if (testName.includes('Database') || testName.includes('Query')) {
    return 'database';
  } else if (testName.includes('Timeout') || testName.includes('Slow') || testName.includes('Performance')) {
    return 'performance';
  } else if (testName.includes('Unit') || testName.includes('Mock')) {
    return 'unit';
  }
  return 'generic';
}

function generateSeleniumDiff(className, testName) {
  const filePath = className.replace(/\./g, '/') + '.java';

  return `diff --git a/${filePath} b/${filePath}
index 1a2b3c4..5d6e7f8 100644
--- a/${filePath}
+++ b/${filePath}
@@ -1,15 +1,25 @@
 import org.openqa.selenium.WebDriver;
 import org.openqa.selenium.WebElement;
 import org.openqa.selenium.By;
+import org.openqa.selenium.support.ui.WebDriverWait;
+import org.openqa.selenium.support.ui.ExpectedConditions;
+import java.time.Duration;

 public class ${className} {
     private WebDriver driver;

     @Before
     public void setup() {
         driver = new ChromeDriver();
+        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
     }

     @Test
     public void ${testName}() {
+        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
         driver.get("https://example.com");
-        WebElement button = driver.findElement(By.id("submit"));
-        button.click();
+
+        WebElement button = wait.until(ExpectedConditions.elementToBeClickable(By.id("submit")));
+        button.click();
+
+        WebElement result = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("result")));
         assert result.isDisplayed();
     }
 }`;
}

function generateIntegrationDiff(className, testName) {
  const filePath = className.replace(/\./g, '/') + '.java';

  return `diff --git a/${filePath} b/${filePath}
index 1a2b3c4..5d6e7f8 100644
--- a/${filePath}
+++ b/${filePath}
@@ -1,20 +1,35 @@
 import static org.junit.jupiter.api.Assertions.*;
 import org.junit.jupiter.api.Test;
+import org.junit.jupiter.api.BeforeEach;
+import com.github.tomakehurst.wiremock.WireMockServer;
+import com.github.tomakehurst.wiremock.client.WireMock;

 public class ${className} {
+    private WireMockServer wireMockServer;
+    private ApiClient apiClient;

-    @Test
-    public void ${testName}() {
+    @BeforeEach
+    public void setUp() {
+        wireMockServer = new WireMockServer();
+        wireMockServer.start();
+        apiClient = new ApiClient("http://localhost:8080");
+    }
+
+    @Test
+    public void ${testName}() {
         try {
+            // Mock external API response
+            wireMockServer.stubFor(get("/api/data").willReturn(ok()
+                .withBody("{\\"status\\": \\"success\\"}")));
+
             ApiResponse response = apiClient.callApi();
-            assertNotNull(response);
+            assertNotNull(response, "Response should not be null");
             assertEquals("success", response.getStatus());
+            assertTrue(response.isValid(), "Response should be valid");
         } catch (ApiException e) {
-            fail(e.getMessage());
+            fail("API call should not throw exception: " + e.getMessage(), e);
         }
+        wireMockServer.stop();
     }
 }`;
}

function generateUnitDiff(className, testName) {
  const filePath = className.replace(/\./g, '/') + '.java';

  return `diff --git a/${filePath} b/${filePath}
index 1a2b3c4..5d6e7f8 100644
--- a/${filePath}
+++ b/${filePath}
@@ -1,18 +1,28 @@
 import static org.junit.jupiter.api.Assertions.*;
 import org.junit.jupiter.api.Test;
+import org.mockito.Mock;
+import org.mockito.MockitoAnnotations;
+import static org.mockito.Mockito.*;

 public class ${className} {
+    @Mock
+    private Dependency dependency;
+    private ServiceUnderTest service;

-    @Test
-    public void ${testName}() {
+    @Before
+    public void setup() {
+        MockitoAnnotations.openMocks(this);
+        service = new ServiceUnderTest(dependency);
+    }
+
+    @Test
+    public void ${testName}() {
-        Service service = new Service();
-        String result = service.process("input");
+        when(dependency.getValue()).thenReturn("expected");
+        String result = service.process("input");
-        assertNotNull(result);
-        assertEquals("expected", result);
+        assertNotNull(result, "Result should not be null");
+        assertEquals("expected", result, "Result should match expected value");
+        verify(dependency).getValue();
     }
 }`;
}

function generateDatabaseDiff(className, testName) {
  const filePath = className.replace(/\./g, '/') + '.java';

  return `diff --git a/${filePath} b/${filePath}
index 1a2b3c4..5d6e7f8 100644
--- a/${filePath}
+++ b/${filePath}
@@ -1,20 +1,35 @@
 import static org.junit.jupiter.api.Assertions.*;
 import org.junit.jupiter.api.Test;
+import org.junit.jupiter.api.BeforeEach;
+import org.junit.jupiter.api.AfterEach;
+import org.testcontainers.containers.PostgreSQLContainer;
+import org.testcontainers.junit.jupiter.Container;
+import org.testcontainers.junit.jupiter.Testcontainers;

+@Testcontainers
 public class ${className} {
+    @Container
+    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>()
+        .withDatabaseName("testdb")
+        .withUsername("testuser")
+        .withPassword("testpass");

+    private DatabaseService dbService;

+    @BeforeEach
+    public void setUp() {
+        String url = postgres.getJdbcUrl();
+        dbService = new DatabaseService(url, "testuser", "testpass");
+    }

     @Test
     public void ${testName}() {
         try {
-            db.insert("INSERT INTO users VALUES (1, 'test')");
+            // Setup test data
+            dbService.executeQuery("DELETE FROM users");
+            dbService.insert("INSERT INTO users VALUES (1, 'test')");
+
+            // Execute and verify
             User user = db.findById(1);
             assertNotNull(user, "User should exist");
             assertEquals("test", user.getName());
@@ -22,4 +37,8 @@
             fail("Database operation failed: " + e.getMessage(), e);
         }
     }
+
+    @AfterEach
+    public void tearDown() {
+        dbService.close();
+    }
 }`;
}

function generatePerformanceDiff(className, testName) {
  const filePath = className.replace(/\./g, '/') + '.java';

  return `diff --git a/${filePath} b/${filePath}
index 1a2b3c4..5d6e7f8 100644
--- a/${filePath}
+++ b/${filePath}
@@ -1,18 +1,30 @@
 import static org.junit.jupiter.api.Assertions.*;
 import org.junit.jupiter.api.Test;
+import org.junit.jupiter.api.Timeout;
+import java.util.concurrent.TimeUnit;

+@Timeout(value = 5, unit = TimeUnit.SECONDS)
 public class ${className} {

     @Test
     public void ${testName}() {
         Service service = new Service();

+        // Warm up
+        service.process("warm-up");
+
+        // Measure performance
         long startTime = System.nanoTime();

-        for (int i = 0; i < 1000; i++) {
+        for (int i = 0; i < 100; i++) {
             String result = service.process("test-" + i);
             assertNotNull(result);
         }

         long duration = (System.nanoTime() - startTime) / 1_000_000;
-        assertTrue(duration < 5000, "Operation took too long: " + duration + "ms");
+
+        // Assert performance threshold
+        long expectedThreshold = 1000;  // 1 second for 100 operations
+        assertTrue(duration < expectedThreshold,
+            "Performance test failed. Expected < " + expectedThreshold + "ms but took " + duration + "ms");
     }
 }`;
}

function generateGenericDiff(className, testName) {
  const filePath = className.replace(/\./g, '/') + '.java';

  return `diff --git a/${filePath} b/${filePath}
index 1a2b3c4..5d6e7f8 100644
--- a/${filePath}
+++ b/${filePath}
@@ -1,15 +1,22 @@
 import static org.junit.jupiter.api.Assertions.*;
 import org.junit.jupiter.api.Test;
+import org.junit.jupiter.api.BeforeEach;

 public class ${className} {
+    private ServiceUnderTest service;
+
+    @BeforeEach
+    public void setup() {
+        service = new ServiceUnderTest();
+    }

     @Test
     public void ${testName}() {
-        ServiceUnderTest service = new ServiceUnderTest();
         Object result = service.executeOperation();

-        assertNotNull(result);
+        assertNotNull(result, "Result should not be null");
+        assertTrue(isValid(result), "Result should be valid");
     }

+    private boolean isValid(Object obj) {
+        return obj != null && !obj.toString().isEmpty();
+    }
 }`;
}
