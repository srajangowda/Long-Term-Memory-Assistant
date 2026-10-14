# Design Specification — Long-Term Memory Assistant (Phase 1)

## 1. Product Purpose
The **Long-Term Memory Assistant** is an intelligent conversational agent engineered to deliver reliable, context-aware dialogues. Phase 1 establishes the foundational user interface and resilient communication pipeline with **Google Gemini** (using a provider-independent `LLMProvider` architecture). The interface emphasizes clarity, zero cognitive friction, responsive interaction, and architectural readiness for future memory visualization (knowledge graph & vector memory).

---

## 2. Target User
- **Engineers & Researchers:** Requiring a high-performance, distraction-free conversational AI interface.
- **Enterprise & Independent Developers:** Interacting with state-of-the-art foundation models with minimal configuration overhead and transparent error handling.
- **Developers extending the platform:** Needing modular React and TypeScript components that can easily accommodate memory inspection panels and metadata overlays in later phases.

---

## 3. Visual Direction
- **Minimalist & Utilitarian:** Focus is entirely on the conversation and information density.
- **Dark Neutral Palette:** Deep slate backgrounds reduce eye strain and provide contrast for syntax and dialogue.
- **Zero Distraction:** No bouncy or unnecessary animations; transitions are limited to subtle fades and loading state pulses.
- **Technical Precision:** Crisp borders (`1px border-slate-800`), refined corner radiuses (`rounded-xl` / `rounded-2xl`), and clear hierarchy.

---

## 4. Color Palette

| Token | Hex Value | Usage |
|---|---|---|
| **Background Darkest** | `#090d16` (slate-950) | Main viewport background |
| **Surface Dark** | `#0f172a` (slate-900) | Header, input container, AI message bubbles |
| **Surface Elevated** | `#151f32` (slate-850) | Buttons, badges, prompt suggestion cards |
| **Borders** | `#1e293b` (slate-800) | Separator lines, container boundaries |
| **Primary Accent** | `#4f46e5` (indigo-600) | Send button, user bubble, primary interactive elements |
| **Text Primary** | `#f8fafc` (slate-50) | Message content, headings |
| **Text Secondary** | `#94a3b8` (slate-400) | Timestamps, subtitles, secondary hints |
| **Text Muted** | `#64748b` (slate-500) | Placeholder text, shortcuts |
| **Success / Online** | `#10b981` (emerald-500) | Server health indicator |
| **Warning / Notice** | `#fbbf24` (amber-400) | Scope notice (Phase 1 context limitation) |
| **Error / Alert** | `#f43f5e` (rose-500) | Error banners and disconnect indicators |

---

## 5. Typography
- **Font Stack:** Modern system font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`).
- **Hierarchy:**
  - Application Title: `16px / 18px` (Font Weight: Semi-Bold `600`)
  - Section / Empty State Title: `20px` (Font Weight: Semi-Bold `600`)
  - Body / Message Content: `14px` (`text-sm`), Line Height `1.625` (`leading-relaxed`)
  - Auxiliary / Timestamps / Hints: `11px - 12px` (`text-xs` / `text-[11px]`)
- **Spacing & Monospace Elements:** Monospace used for model identifiers, status codes, and terminal references.

---

## 6. Spacing and Layout
- **Container Width:** Constrained to `max-w-4xl` (~896px) for optimal readability and reading line-length (65–85 characters per line).
- **Vertical Rhythm:**
  - Header: `px-4 py-3.5`
  - Message bubble gap: `14px` (`my-3.5`)
  - Chat input container: `p-4` with sticky footer pinning
- **Grid / Density:** Fluid viewport height layout (`h-screen overflow-hidden`) with a scrollable messages panel (`flex-1 overflow-y-auto`).

---

## 7. Reusable Component Specifications

### 7.1 Header (`Header.tsx`)
- Displays product brand, Phase 1 badge, and real-time backend health status.
- Features a subtle indicator making it explicit that Phase 1 uses in-session context and does not persist long-term memory.
- Contains a "Reset Chat" action when messages exist, allowing the user to start a fresh dialogue session.

### 7.2 ChatWindow (`ChatWindow.tsx`)
- Renders the chronological list of messages.
- Employs smooth auto-scrolling to the latest message as new content arrives.
- Houses the empty state view with structured introductory prompts.
- Renders the AI "Thinking..." indicator and dismissible error alerts.

### 7.3 MessageBubble (`MessageBubble.tsx`)
- Distinct styling between user and assistant:
  - **User:** Right-aligned, Indigo primary background, crisp top-right corner bevel (`rounded-tr-sm`), user avatar.
  - **Assistant:** Left-aligned, Slate-900 background with Slate-800 border, crisp top-left corner bevel (`rounded-tl-sm`), bot icon avatar.
- Preserves whitespace and newlines (`whitespace-pre-wrap break-words`).
- Displays message delivery time.

### 7.4 ChatInput (`ChatInput.tsx`)
- Auto-growing multiline `textarea` supporting up to 180px before smooth internal scrolling.
- Keyboard ergonomics:
  - `Enter`: Submits message.
  - `Shift + Enter`: Inserts newline.
- Submit button with dynamic state:
  - Disabled & dimmed when input is empty or request is in-flight.
  - Spinner replaces icon during active generation.

---

## 8. Chat States

1. **Initial / Empty State:**
   - Friendly greeting with phase badge.
   - Clarification that long-term vector/graph memory will be introduced in subsequent phases.
   - Clickable suggestion chips to immediately test AI responses.

2. **Active Conversation:**
   - Multi-turn conversation preserved in browser memory.
   - Consecutive user and assistant bubbles with auto-scroll.

3. **Loading / Processing State:**
   - Chat input disabled.
   - Animated three-dot pulse with "Thinking..." label in an assistant-aligned bubble.
   - Send button displays a spinner.

4. **Error State:**
   - Reversible error banners displaying safe, non-sensitive messages.
   - Retains conversation history without wiping user input.

5. **Server Disconnected State:**
   - Health dot turns red.
   - Informative notice explaining backend status.

---

## 9. Responsive Behavior
- **Mobile (< 640px):**
  - Message bubble width stretches to 85% of screen.
  - Header health text switches to compact dot indicator.
  - Input send button adapts to upward-arrow icon.
- **Desktop (>= 640px):**
  - Centered 4xl column.
  - Full labels and starter prompt grid (2 columns).

---

## 10. Accessibility (a11y)
- **High Contrast:** All text meets or exceeds WCAG 2.1 AA standards (minimum 4.5:1 ratio against backgrounds).
- **Aria Labels:** Interactive buttons (`aria-label="Send message"`, `aria-label="User Avatar"`) are labeled for screen readers.
- **Keyboard Navigation:** Full tab order throughout header, prompts, textarea, and send button.
- **Focus Indicators:** High-visibility Indigo focus rings (`focus-within:ring-indigo-500/30`) for keyboard navigation.

