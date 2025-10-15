# RegenGarden Documentation

Quick guide to project documentation.

---

## 📄 Documentation Files

### 🎯 **todo.md** - START HERE
**Primary roadmap and feature tracking**
- Current focus: Step 25 (Canvas Drawing Tools)
- Organized by priority: High → Medium → Low
- Progress tracking with ✅/⏳ status indicators
- Complete feature breakdown with step numbers
- ~200 lines (condensed from 600+)

**Use this for:**
- Understanding what's next
- Finding completed vs pending features
- Planning new work

---

### 🏗️ **session-context.md** - QUICK REFERENCE
**Current project state and architecture**
- Tech stack overview (Next.js + Spring Boot + PostgreSQL)
- Running instructions
- Data models (GrowArea, CanvasObject)
- Key files and gotchas
- ~100 lines (condensed from 234)

**Use this for:**
- Getting started quickly
- Understanding architecture
- Finding critical files
- Avoiding common pitfalls

---

### 📝 **changelog.md** - RECENT CHANGES
**What's been built recently**
- Latest features (last 2 weeks)
- Recent bug fixes
- Version history summary
- ~50 lines (condensed from 200+)

**Use this for:**
- Catching up on recent work
- Understanding what changed

---

### 🧪 **playwright-tests.md** - TESTING GUIDE
**E2E test documentation**
- Test structure and patterns
- Cleanup strategies
- Selector conventions
- Running tests
- Troubleshooting tips

**Use this for:**
- Writing new tests
- Debugging test failures
- Understanding test patterns

---

## 🗺️ Documentation Strategy

**For a new agent joining the project:**
1. Read **session-context.md** (5 min) - Get oriented
2. Skim **todo.md** (10 min) - Understand roadmap
3. Reference **changelog.md** as needed - See recent changes
4. Use **playwright-tests.md** when writing tests

**Total onboarding time:** ~15-20 minutes to be productive

---

## 📊 Recent Optimization (October 15, 2025)

Reduced documentation from ~1,000 lines to ~400 lines by:
- Removing duplicate information across files
- Consolidating step-by-step details into todo.md
- Removing verbose historical descriptions
- Deleted step-25-progress.md (merged into todo.md)
- Focusing each file on its specific purpose

**Result:** Clearer, more maintainable docs with same essential information.

