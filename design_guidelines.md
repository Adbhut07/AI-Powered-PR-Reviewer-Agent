# Design Guidelines: GitHub PR Review AI Agent

## Design Approach

**Selected Approach:** Design System - Developer Tool Pattern
**Primary References:** Linear, GitHub UI, Vercel Dashboard
**Justification:** This is a utility-focused developer productivity tool requiring clarity, information density, and consistency over visual flair.

## Core Design Principles

1. **Information Clarity:** Code reviews and technical findings must be immediately scannable
2. **Functional Hierarchy:** Status indicators and critical issues take visual priority
3. **Developer-First UX:** Familiar patterns from tools developers use daily (GitHub, Linear, VS Code)

## Typography System

**Font Families:**
- Primary: Inter (via Google Fonts CDN) - UI text, labels, descriptions
- Monospace: JetBrains Mono (via Google Fonts CDN) - code snippets, file paths, technical data

**Hierarchy:**
- Page Titles: text-2xl, font-semibold (Inter)
- Section Headers: text-lg, font-semibold
- Card Titles/PR Titles: text-base, font-medium
- Body Text: text-sm, font-normal
- Meta Info (timestamps, status): text-xs, font-normal
- Code/Technical: text-sm, font-mono

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, and 8 consistently
- Component padding: p-4 or p-6
- Section spacing: space-y-6 or space-y-8
- Card gaps: gap-4
- Tight groupings: gap-2

**Grid Structure:**
- Main container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- Dashboard grid: 3-column layout on lg+, 1-column on mobile
- Responsive breakpoints: sm, md, lg, xl

## Component Library

### Navigation
**Top Navigation Bar:**
- Fixed header with subtle border-b
- Logo/app name on left
- Navigation links center (Dashboard, Activity, Settings)
- User profile/GitHub connection status right
- Height: h-16
- Padding: px-6

### Dashboard Layout
**Main Dashboard:**
- Two-column layout (2/3 + 1/3 split on desktop)
- Left: Recent PR Reviews list
- Right: Activity feed + Webhook status

**PR Review Cards:**
- Border with subtle shadow
- Rounded corners (rounded-lg)
- Padding: p-6
- Contains: PR title, repository name, timestamp, status badge, findings count, action buttons
- Status badges: Small pills with icon + text (e.g., "✓ Approved", "⚠ Issues Found", "⏳ In Progress")

### Data Display Components

**Review Findings List:**
- Each finding in bordered container (border-l-4 for severity indicator)
- Severity levels: Critical (thick left border), Warning, Info
- Icons from Heroicons: ExclamationTriangle, InformationCircle, CheckCircle
- Monospace font for file paths and code references
- Collapsible sections for detailed explanations

**Activity Feed:**
- Timeline layout with connecting line
- Icons indicating event type (PR opened, review completed, comment posted)
- Timestamp on right
- Compact spacing (space-y-3)

**Code Diff Display:**
- Monospace font throughout
- Line numbers in muted text
- Simple +/- indicators for additions/removals
- Contained in rounded-lg border box with slight background differentiation

### Forms & Inputs

**Webhook Configuration:**
- Input fields with labels above
- Helper text below in text-xs
- Border focus states using ring utilities
- Copy-to-clipboard button for webhook URL (icon-only, positioned right of input)

### Status Indicators

**Webhook Status Card:**
- Small card in sidebar
- Large status indicator (dot with pulse animation if active)
- Last event timestamp
- Event count today

**PR Status Badges:**
- Inline badges using rounded-full
- Icon + text combination
- Size: px-3 py-1, text-xs

### Action Elements

**Primary Actions:**
- "Review Now" buttons on PR cards
- "Configure Webhook" in settings
- Size: px-4 py-2, text-sm, rounded-md
- Icons from Heroicons (ArrowRight, Cog)

**Secondary Actions:**
- "View on GitHub" links (external icon)
- "Dismiss" or "Mark as Read" (subtle, text-only)

## Navigation Structure

**Primary Navigation:**
1. Dashboard (home) - Overview of recent reviews
2. Reviews - Filterable list of all PR reviews
3. Activity - Full activity log
4. Settings - Webhook config, GitHub connection, AI preferences

**Empty States:**
- Large icon (from Heroicons)
- Heading: "No PR reviews yet"
- Description text
- CTA button: "Configure Webhook" or "Connect GitHub"

## Responsive Behavior

**Desktop (lg+):**
- Multi-column dashboard layout
- Sidebar visible
- Full PR card details shown

**Tablet (md):**
- Stack sidebar below main content
- 2-column grid where appropriate

**Mobile (base):**
- Single column throughout
- Collapsed/expandable sections for findings
- Bottom navigation for primary tabs

## Layout Patterns

**Dashboard Page:**
- Full viewport height container
- Sticky header
- Main content area with py-8
- Grid layout for cards: grid grid-cols-1 lg:grid-cols-3 gap-6

**PR Review Detail Page:**
- Breadcrumb navigation at top
- PR header section: title, metadata, GitHub link
- Tabs for: Overview, Findings, Code Changes, Activity
- Content area: max-w-5xl for readability

**Settings Page:**
- Two-column form layout on desktop
- Section headers with dividers
- Form groups with space-y-6

## Icons

**Icon Library:** Heroicons (via CDN)
**Common Icons:**
- CheckCircle, XCircle, ExclamationTriangle for status
- CodeBracket for code-related actions
- Clock for timestamps/activity
- Cog for settings
- ArrowTopRightOnSquare for external links
- BellAlert for notifications

## Accessibility

- All interactive elements have focus-visible states using ring utilities
- ARIA labels on icon-only buttons
- Semantic HTML: proper heading hierarchy, nav, main, article tags
- Keyboard navigation support for all actions
- High contrast text-to-background ratios

## Special Considerations

**Code Display:** All code snippets, file paths, and technical identifiers use monospace font with slightly reduced line-height for density

**Real-time Updates:** Include visual indicators (subtle pulse animations) when new data arrives via webhook

**Loading States:** Skeleton screens for PR lists, spinner for individual actions