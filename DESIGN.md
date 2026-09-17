---
name: Freeman Madudili — Working Objects
description: Light product displays, optional dark navy scenes, mint actions, and clear engineering evidence.
colors:
  story-canvas: "#f7f8fa"
  story-white: "#ffffff"
  story-ink: "#020c1b"
  story-object-ink: "#020c1b"
  story-muted: "#596271"
  story-accent: "#64ffda"
  story-accent-hover: "#93ffe5"
  story-line: "#dce1e9"
  story-night: "#020c1b"
  story-night-muted: "#a8b7ca"
  story-night-line: "#20364a"
  story-night-text: "#f4f6fc"
  story-night-highlight: "#64ffda"
  story-audit-muted: "#174d47"
  story-audit-highlight: "#246257"
  story-audit-line: "#40bda0"
  story-audit-paper: "#f7f8fc"
  story-audit-button-text: "#64ffda"
  story-assistant-paper: "#fafbff"
  story-project-stage: "#e5f3ee"
  story-portrait-stage: "#d7fff2"
  assistant-ink: "#020c1b"
  assistant-muted: "#666666"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "76px"
    fontWeight: 500
    lineHeight: 1.08
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "56px"
    fontWeight: 500
    lineHeight: 1.12
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "32px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "12px"
    fontWeight: 400
  button:
    fontFamily: "Inter, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0"
rounded:
  screen: "8px"
  media: "10px"
  paper: "12px"
  plane: "14px"
  object: "16px"
  assistant: "32px"
  pill: "999px"
spacing:
  detail-gap: "20px"
  content-gap: "24px"
  compact-gutter: "20px"
  medium-gutter: "32px"
  wide-gutter: "48px"
components:
  button-primary:
    backgroundColor: "{colors.story-accent}"
    textColor: "{colors.story-object-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "13px 24px"
  button-primary-hover:
    backgroundColor: "{colors.story-accent-hover}"
    textColor: "{colors.story-object-ink}"
  button-audit:
    backgroundColor: "{colors.story-object-ink}"
    textColor: "{colors.story-audit-button-text}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
  project-plane:
    backgroundColor: "{colors.story-white}"
    textColor: "{colors.story-object-ink}"
    rounded: "{rounded.plane}"
  assistant-object:
    backgroundColor: "{colors.story-assistant-paper}"
    textColor: "{colors.story-object-ink}"
    rounded: "{rounded.object}"
    padding: "30px"
  audit-paper:
    backgroundColor: "{colors.story-audit-paper}"
    textColor: "{colors.story-object-ink}"
    rounded: "{rounded.paper}"
    padding: "38px"
  navigation:
    backgroundColor: "rgb(255 255 255 / 90%)"
    textColor: "{colors.story-muted}"
    rounded: "{rounded.pill}"
    padding: "8px 24px"
    height: "64px"
  assistant-input:
    backgroundColor: "transparent"
    textColor: "{colors.assistant-ink}"
    rounded: "{rounded.object}"
    padding: "8px 0"
    height: "40px"
---

# Design System: Freeman Madudili

## Overview

**Creative North Star: "Working Objects"**

Real interfaces and small working interactions carry the visual identity. Light space, navy text, mint actions, and gently tilted product objects make the engineering tangible. Manrope gives the display language a rounded, precise character; Inter keeps the evidence easy to read.

This documents the implemented public portfolio and its shared navigation. The existing assistant retains its established conversation controls. Page order and the current composition belong in `.impeccable/surface-briefs/public-home.md`; this file records reusable visual decisions, not a replacement product or architecture specification.

**Key Characteristics:**

- Dimensional project objects within generous, quiet space.
- Mint actions and a mint audit invitation.
- Restrained reading typography and inline disclosure of detail.
- Motion enhances visible content without delaying access to it.

## Colors

The palette uses Freeman’s original mint `#64FFDA` and dark navy `#020C1B`, with light surfaces, navy text, and an optional dark presentation. The frontmatter records light-mode values; dark mode overrides the canvas to `#020C1B`, text to `#E6F1FF`, muted text to `#A8B7CA`, rules to `#20364A`, and the project stage to `#0A192F`. Contextual shades are deliberate section overrides.

### Primary

Mint identifies primary actions, selected headline phrases, and the audit invitation. Mint fills carry navy text. The audit button reverses to navy with mint lettering. Dark green supplies readable links and focus feedback inside light interface objects.

### Neutral

Light mode is the default: frost paper is the page ground, with navy text and cool-grey rules. Dark mode uses navy ground, pale text, and blue-grey rules. White and lightly tinted paper hold real project and assistant interfaces in both modes. The systems scene uses navy in either mode; the mint audit scene uses navy text and green rules.

**The Contextual Contrast Rule.** Keep each section's text, divider, and focus colors together; a dark background is a complete color context.

## Typography

Manrope is the display family; Inter is the reading and control family. Both are loaded through Next font variables. JetBrains Mono remains available to existing application controls, but is not the public story's display voice.

The frontmatter records default desktop roles. Hero copy uses 17px reading text with a 630px maximum width; body copy varies from 14–16px by depth. Labels and captions generally use 12px. Displays use balanced wrapping and paragraphs use pretty wrapping.

At the medium breakpoint, display/headline become 64px/44px. At the compact breakpoint, the final cascade uses 41px/37px/27px for display/headline/title. Intentional local exceptions include the audit title (80px desktop, 68px medium, 61px compact), the person heading, and assistant object titles. Do not normalize these expressive differences into a single heading size.

## Layout

The reading container caps at 1200px with 48px side gutters, reducing to 32px below 1100px and 20px below 700px. The navigation caps at 1280px; the hero object stage caps at 1420px. Content alternates full-width color fields with constrained inner grids.

Two-column project, assistant, person, and audit scenes become one column at 700px. The compact hero retains the main project object and assistant entry while removing the secondary side image. The sticky portrait becomes static. Navigation links remain visible without a menu overlay; the smallest adjustment occurs at 360px.

Sections have generous, purpose-specific vertical spacing rather than a fabricated uniform scale. Anchored story sections and disclosures use a 112px scroll margin. The footer reserves bottom space for the floating assistant.

## Elevation & Depth

Depth belongs to tangible objects: project planes, the assistant prompt surface, and the sample audit sheet. Their soft shadows and small rotations distinguish them from the flat reading canvas. Floating navigation alone uses translucent glass and a subtle shadow; reduced-transparency preference makes it opaque.

Exact shadows, transition timing, and breakpoints live in `.impeccable/design.json`. Main project objects use the shared story shadow; the assistant and audit paper have stronger shadows against colored backgrounds. Buttons remain flat.

## Shapes

Pills identify primary actions and floating navigation. Media and paper use the modest corner radii recorded above; compact assistant conversation surfaces retain their existing larger rounding. Thin horizontal rules and unboxed text connect expandable content. Avoid wrapping every paragraph in a card.

## Components

### Buttons and links

Primary story buttons have a 50px minimum height; their compact variant uses 46px with 12px × 18px padding. Pointer hover lightens mint and raises the button slightly; press scales it to 0.97. Text links have a 48px minimum height and gain an underline on hover. The audit action is navy on mint with a 52px minimum height.

Page links navigate to anchors. Assistant prompts and enquiry actions open the existing assistant. Use a real button for actions and a link for destinations. Global keyboard focus uses a 3px dark-green outline in light mode and mint in dark mode, with a 5px offset; the mint section uses navy, and light objects use dark green. Existing assistant primitives retain their own focus treatment.

### Navigation

The sticky pill holds the existing Freemancodz logo and visible section links. It is 64px tall on desktop and 58px on compact screens. Links have 44px minimum heights and a mint hover. Compact sizing reduces the logo and gaps without removing the destinations. A keyboard-accessible skip link precedes the navigation. Its theme switch remembers a visitor’s choice in local storage; a synchronous bootstrap applies saved dark mode before paint. Fresh visits use light mode, and switching still works if preference storage is unavailable. Palette colours and the hero lighting transition together over 240ms; reduced motion switches immediately.

### Objects and disclosures

Project planes crop real screenshots to their established aspect ratio; the featured screen sits within a pale mint stage. The assistant object contains actionable prompt rows separated by rules. The audit sheet is explicitly an illustrative example, not fabricated client evidence.

Native details/summary controls expose project, career, interests, and audit depth. Summary rows have a 60px minimum height; additional-project rows use 76px. Opening rotates the plus icon and animates the content briefly. Deep-link handling opens enclosing disclosures before positioning the destination.

### Assistant input

The existing composer uses a borderless, transparent, 40px-high textarea, with muted placeholder copy and circular send control. It remains part of the established assistant UI, with its existing disabled, validation, and conversation behavior. The textarea has no outline; a subtle green underline on its wrapper preserves keyboard focus feedback.

### Imagery and motion

Preserve real repository images and canonical CMS media references. The implemented project compositions use `public/images/work/withradius-hero.jpg` and `public/images/work/across-the-horizon.jpg`; navigation uses the existing logo. Missing managed images retain readable context through the intentional fallback; do not substitute invented portraits or project results. Shipping-asset provenance belongs in the finish asset record.

`StoryMotion` coordinates bounded hero movement, viewport-relative movement for each visual scene, one-time arrivals, and hash destinations; CSS owns the visual transitions. Headings and visual compositions rise from below; horizontal travel is reserved for the email plane. Entrances begin at least 120px inside the viewport so visitors see them while scrolling. The workflow waits until 65% of its figure is visible, keeping all four steps in view for their entrance on mobile. Project screens change their tilt, the assistant and audit objects drift vertically, and the email plane faces right and travels into its workflow. Workflow icons enter in a 200ms pop with an 80ms stagger. Text is readable before motion runs. Reduced motion disables animated transitions, smooth scrolling, and dynamic object movement while retaining the static composition. The assistant retains its existing Framer Motion behavior; there is no experimental view-transition dependency.

## Do's and Don'ts

### Do:

- Do use real interfaces and working interactions as the visual evidence.
- Do keep long reading content flat, with detail available through native disclosures.
- Do preserve visible destinations and readable content on compact screens.
- Do respect reduced-motion and reduced-transparency preferences.

### Don't:

- Don't invent portraits, testimonials, project results, or replacement CMS content.
- Don't extend navigation glass into a page-wide material treatment.
- Don't hide reading content until an animation completes.
- Don't apply this public-page treatment indiscriminately to protected admin or assistant workflows.
