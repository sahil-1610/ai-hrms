# Embedding AI-HRMS on External Websites

This guide explains how to embed AI-HRMS careers pages and job application forms on your external website.

## Overview

AI-HRMS provides embeddable components that can be added to any website using iframes:

1. **Jobs Listing** - Display all open positions
2. **Job Application Form** - Let candidates apply directly

---

## Quick Start

### Embed Jobs Listing

Add this iframe to your website to display all open positions:

```html
<iframe
  src="https://your-hrms-domain.com/embed/jobs"
  width="100%"
  height="800"
  frameborder="0"
  style="border: none; min-height: 600px;"
></iframe>
```

### Embed Single Job Application

To embed an application form for a specific job:

```html
<iframe
  src="https://your-hrms-domain.com/embed/apply/[JOB_ID]"
  width="100%"
  height="900"
  frameborder="0"
  style="border: none; min-height: 700px;"
></iframe>
```

Replace `[JOB_ID]` with the actual job UUID (e.g., `61bc765a-7e18-484b-874b-737f2aa66ea8`).

---

## Jobs Listing Options

### URL Parameters

| Parameter | Values | Description |
|-----------|--------|-------------|
| `department` | String | Filter jobs by department (e.g., `?department=Engineering`) |
| `location` | String | Filter jobs by location (e.g., `?location=Remote`) |
| `limit` | Number | Limit the number of jobs shown (e.g., `?limit=5`) |
| `hideSearch` | `true` | Hide the search bar and filters |
| `hideHeader` | `true` | Hide the company header/branding |
| `compact` | `true` | Use compact card layout for smaller spaces |

### Examples

**Show only 5 Engineering jobs:**
```html
<iframe
  src="https://your-hrms-domain.com/embed/jobs?department=Engineering&limit=5"
  width="100%"
  height="500"
  frameborder="0"
></iframe>
```

**Compact listing without header:**
```html
<iframe
  src="https://your-hrms-domain.com/embed/jobs?hideHeader=true&compact=true"
  width="100%"
  height="400"
  frameborder="0"
></iframe>
```

**Remote jobs only:**
```html
<iframe
  src="https://your-hrms-domain.com/embed/jobs?location=Remote"
  width="100%"
  height="600"
  frameborder="0"
></iframe>
```

---

## Application Form Options

### URL Parameters

| Parameter | Values | Description |
|-----------|--------|-------------|
| `hideHeader` | `true` | Hide the job title header |
| `theme` | `light` or `dark` | Force a specific theme |

### Examples

**Minimal form without header:**
```html
<iframe
  src="https://your-hrms-domain.com/embed/apply/[JOB_ID]?hideHeader=true"
  width="100%"
  height="700"
  frameborder="0"
></iframe>
```

---

## JavaScript Events

The embedded pages communicate with the parent window using `postMessage`. You can listen for these events to create custom interactions.

### Available Events

#### From Jobs Listing

```javascript
window.addEventListener("message", (event) => {
  if (event.data.type === "JOB_SELECTED") {
    console.log("Job selected:", event.data.jobId);
    console.log("Apply URL:", event.data.applyUrl);
    // Custom handling: open in modal, new tab, etc.
  }

  if (event.data.type === "VIEW_ALL_JOBS") {
    // User clicked "View all positions"
    // Redirect to your careers page or expand the iframe
  }
});
```

#### From Application Form

```javascript
window.addEventListener("message", (event) => {
  if (event.data.type === "APPLICATION_SUBMITTED") {
    console.log("Application submitted for job:", event.data.jobId);
    console.log("Candidate email:", event.data.email);
    // Show thank you message, track conversion, etc.
  }
});
```

### Custom Job Selection Handling

By default, clicking a job navigates to the apply form within the iframe. To override this behavior:

```javascript
window.addEventListener("message", (event) => {
  if (event.data.type === "JOB_SELECTED") {
    // Prevent default navigation by handling it yourself
    event.preventDefault();

    // Example: Open in a modal
    openApplicationModal(event.data.jobId);

    // Example: Open in new tab
    window.open(`https://your-hrms-domain.com/careers/jobs/${event.data.jobId}/apply`, '_blank');
  }
});
```

---

## Styling & Responsiveness

### Responsive Container

```html
<div style="position: relative; width: 100%; max-width: 1200px; margin: 0 auto;">
  <iframe
    src="https://your-hrms-domain.com/embed/jobs"
    style="width: 100%; height: 800px; border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
  ></iframe>
</div>
```

### Auto-Resizing (Advanced)

For dynamic height adjustment based on content:

```html
<iframe
  id="hrms-embed"
  src="https://your-hrms-domain.com/embed/jobs"
  style="width: 100%; border: none;"
></iframe>

<script>
window.addEventListener("message", (event) => {
  if (event.data.type === "IFRAME_HEIGHT") {
    document.getElementById("hrms-embed").style.height = event.data.height + "px";
  }
});
</script>
```

---

## Complete Integration Example

Here's a full example showing a careers section with both job listing and custom event handling:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Careers - Your Company</title>
  <style>
    .careers-section {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    .careers-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .careers-header h1 {
      font-size: 2.5rem;
      color: #1f2937;
      margin-bottom: 10px;
    }

    .careers-header p {
      color: #6b7280;
      font-size: 1.1rem;
    }

    .jobs-container {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .jobs-container iframe {
      width: 100%;
      height: 800px;
      border: none;
    }

    /* Modal styles for custom job application */
    .modal-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
    }

    .modal-content {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90%;
      max-width: 800px;
      height: 90vh;
      background: white;
      border-radius: 12px;
      overflow: hidden;
    }

    .modal-close {
      position: absolute;
      top: 10px;
      right: 10px;
      background: #f3f4f6;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 18px;
      z-index: 10;
    }
  </style>
</head>
<body>
  <section class="careers-section">
    <div class="careers-header">
      <h1>Join Our Team</h1>
      <p>Discover exciting opportunities and grow your career with us</p>
    </div>

    <div class="jobs-container">
      <iframe
        id="jobs-iframe"
        src="https://your-hrms-domain.com/embed/jobs?hideHeader=true"
      ></iframe>
    </div>
  </section>

  <!-- Modal for application form -->
  <div id="apply-modal" class="modal-overlay">
    <div class="modal-content">
      <button class="modal-close" onclick="closeModal()">&times;</button>
      <iframe id="apply-iframe" style="width: 100%; height: 100%; border: none;"></iframe>
    </div>
  </div>

  <script>
    // Listen for events from the embedded pages
    window.addEventListener("message", (event) => {
      // When a job is selected, open application in modal
      if (event.data.type === "JOB_SELECTED") {
        openApplicationModal(event.data.jobId);
      }

      // When application is submitted, close modal and show thank you
      if (event.data.type === "APPLICATION_SUBMITTED") {
        closeModal();
        showThankYou(event.data.email);
      }
    });

    function openApplicationModal(jobId) {
      const modal = document.getElementById("apply-modal");
      const iframe = document.getElementById("apply-iframe");

      iframe.src = `https://your-hrms-domain.com/embed/apply/${jobId}`;
      modal.style.display = "block";
      document.body.style.overflow = "hidden";
    }

    function closeModal() {
      const modal = document.getElementById("apply-modal");
      const iframe = document.getElementById("apply-iframe");

      modal.style.display = "none";
      iframe.src = "";
      document.body.style.overflow = "";
    }

    function showThankYou(email) {
      alert(`Thank you for applying! We'll contact you at ${email}`);
      // Or show a custom thank you message
    }

    // Close modal on overlay click
    document.getElementById("apply-modal").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) {
        closeModal();
      }
    });
  </script>
</body>
</html>
```

---

## Security Notes

1. **Domain Restrictions**: By default, embeds are allowed from any domain. Contact your admin to restrict to specific domains if needed.

2. **HTTPS Required**: Always use HTTPS URLs for embedding to ensure secure data transmission.

3. **API Access**: The embedded pages only access public job data. No authentication is required for candidates to view jobs or submit applications.

---

## Troubleshooting

### Iframe Not Loading

1. Check that your HRMS domain is accessible
2. Verify the job ID is correct (for application forms)
3. Check browser console for CORS or CSP errors

### Styles Look Wrong

1. Ensure the iframe has enough height (minimum 600px for jobs, 700px for applications)
2. Check if your website's CSS is affecting the iframe

### Events Not Working

1. Ensure you're listening on the correct window (`window.addEventListener`)
2. Check the event origin if you have security restrictions
3. Verify the message type matches exactly (case-sensitive)

---

## Support

For additional help or customization requests, contact your HR administrator or the AI-HRMS support team.
