# @laylalabs/nuxt-back-button

> Hierarchical back button orchestration for Nuxt and Capacitor: priority stack, v-model binding, and customizable double-tap exit.

[![Publish to GitHub Packages](https://github.com/LaylaLabs/nuxt-back-button/actions/workflows/publish.yml/badge.svg)](https://github.com/LaylaLabs/nuxt-back-button/actions/workflows/publish.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Features

- 🎯 **Priority-Based Stack**: Handlers execute in descending priority order (`Confirmation: 100`, `Modal: 50`, `Slideover: 40`, `Default: 0`).
- 🔄 **`bindToModel(isModalOpen)`**: Seamlessly binds any Vue boolean `Ref` (e.g. `isModalOpen`) to the hardware back button with automatic cleanup on unmount.
- 🚪 **Double-Tap to Exit**: Configurable double-tap confirmation on root routes (`/`, `/home`) with customizable callbacks for toasts and telemetry.
- 🛡️ **Framework-Agnostic Core**: Pinia-free reactive state using pure Vue 3 reactivity.
- 🧩 **Zero Boilerplate**: Injects Capacitor listeners and auto-imports `useBackButton()` and `BACK_BUTTON_PRIORITY`.

---

## Installation

Configure your project `.npmrc`:

```ini
@laylalabs:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Install via `pnpm`:

```bash
pnpm add @laylalabs/nuxt-back-button
```

---

## Configuration

In your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: [
    '@laylalabs/nuxt-back-button',
  ],

  backButton: {
    rootPaths: ['/', '/home'],
    exitConfirmation: {
      enabled: true,
      windowMs: 2000,
      onFirstPress: () => {
        // e.g. show toast
      },
      onExit: async () => {
        // e.g. flush analytics
      },
    },
    debug: false,
  },
})
```

---

## Usage

### 1. Bind to a Modal or Drawer (`bindToModel`)

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isModalOpen = ref(false)
const { bindToModel } = useBackButton()

// Automatically closes the modal on hardware back press
bindToModel(isModalOpen, {
  priority: BACK_BUTTON_PRIORITY.MODAL,
  label: 'my-modal',
})
</script>
```

### 2. Custom Step Navigation

```vue
<script setup lang="ts">
const currentStep = ref(2)
const { onBackButton } = useBackButton()

onBackButton(() => {
  if (currentStep.value > 1) {
    currentStep.value--
    return true // Consumes the event!
  }
  return false // Lets lower priority handlers or router.back() handle it
}, { priority: BACK_BUTTON_PRIORITY.STEP })
</script>
```

---

## Canonical Priorities (`BACK_BUTTON_PRIORITY`)

| Level | Priority | Use Case |
| :--- | :--- | :--- |
| `CONFIRMATION` | `100` | Critical alert / exit confirmation dialogs |
| `STEP` | `90` | Multi-step wizards inside a modal |
| `POPOVER` | `60` | Dropdowns, menus, tooltips |
| `MODAL` | `50` | Standard modal dialogs (`UModal`) |
| `NESTED_SLIDEOVER` | `45` | Sheet opened on top of another sheet |
| `SLIDEOVER` | `40` | Bottom sheets, drawers (`UDrawer`) |
| `FULLSCREEN` | `30` | Fullscreen media previewers |
| `DEFAULT` | `0` | Standard navigation (`router.back()`) |

---

## License

[MIT](./LICENSE)
