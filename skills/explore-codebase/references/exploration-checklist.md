# Exploration Checklist

## Required (always)
- [ ] README.md read
- [ ] Package manifest read (package.json / pubspec.yaml / build.gradle / Package.swift)
- [ ] Main entry point identified and read
- [ ] PROJECT.md tech stack table filled
- [ ] PROJECT.md conventions section filled

## Important (if files exist)
- [ ] Database schema read (Prisma / Drizzle / migrations)
- [ ] Router / URL definitions read
- [ ] One full test file read
- [ ] .env.example read
- [ ] CI configuration read
- [ ] *(Monorepo)* Workspace root read (pnpm-workspace.yaml / turbo.json / nx.json)
- [ ] *(Mobile)* App manifest read (AndroidManifest.xml / Info.plist / app.json)
- [ ] *(Mobile)* Platform-specific entry read (MainActivity.kt / ContentView.swift / main.dart)

## Spot Checks (3 minimum)
- [ ] Source file 1: ________________
- [ ] Source file 2: ________________
- [ ] Source file 3: ________________

## Questions to Answer Before Finishing
1. What does this application do? (1 sentence)
2. How does data get from user input to storage? (1-2 sentences)
3. How do you run the tests? (exact command)
4. What is the naming convention for files? Functions? Variables?
5. Is this a monorepo? If so, what packages/apps does it contain?
6. What runtime is used — Node, Deno, Bun, or mobile SDK?
7. Anything unusual or non-standard about this codebase?
