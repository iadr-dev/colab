---
name: android
description: >
  Android development skill suite from Google. Use when working on Android apps,
  Kotlin code, Jetpack libraries, Android Gradle Plugin (AGP), Jetpack Compose UI,
  CameraX, Navigation component, app performance profiling, Google Play publishing,
  Android system APIs, or Android XR/immersive experiences. Triggers include
  "Android app", "Kotlin", "Jetpack Compose", "AGP migration", "CameraX", "Play Store",
  "Android performance", "Gradle upgrade", or any Android-specific development task.
license: Complete terms in LICENSE.txt
metadata:
  author: Google LLC
  keywords:
    - Android
    - Kotlin
    - Jetpack Compose
    - Android Gradle Plugin
    - CameraX
    - Navigation
    - Google Play
    - Android XR
---

# Android Skills

A comprehensive suite of Android development skills from Google, grounding agents
in official Android platform APIs, tooling, and best practices.

Source: [developer.android.com](https://developer.android.com)

## Sub-Skills

Each sub-skill contains its own `SKILL.md` with a full technical specification.
Load the relevant sub-skill when the task matches:

| Sub-Skill | When to Use |
|-----------|-------------|
| `coding/android/agp-9-upgrade` | Migrating a project to Android Gradle Plugin 9. Do **not** use for KMP projects. |
| `coding/android/camera` | Camera2 or CameraX image/video capture, preview, analysis, extensions. |
| `coding/android/jetpack-compose` | Jetpack Compose UI — layouts, state, theming, animations, interop. |
| `coding/android/navigation` | Navigation component, deep links, multi-back-stack, type-safe routes. |
| `coding/android/performance` | App profiling, startup time, frame rate, memory, battery optimization. |
| `coding/android/play` | Google Play publishing, app bundles, delivery, billing, review policies. |
| `coding/android/system` | Android system APIs — permissions, services, broadcasts, app lifecycle. |
| `coding/android/xr` | Android XR — immersive experiences, spatial UI, ARCore, OpenXR. |

## How to Load a Sub-Skill

When the user's task maps to a sub-skill above, read that sub-skill's `SKILL.md`
before writing any code:

```
Read skills/coding/android/<sub-skill>/SKILL.md
```

If the task spans multiple sub-skills (e.g., Compose + Navigation), load both.

## General Android Guidelines

- Always check the sub-skill's **Requirements** and **Verification** sections before starting.
- Prefer Kotlin over Java for all new code.
- Follow the [Modern Android Development](https://developer.android.com/modern-android-development) guidance.
- Use Gradle version catalog (`libs.versions.toml`) for dependency management.
- Never run `./gradlew clean` unless specifically required — it wastes build time.
- For Gradle sync issues, prefer IDE sync over full clean builds.
