# User Data Directory

This directory stores all personal user data and student progress, separate from the master course materials:

- **`state.json` (per course)**: Tracks your question mastery statuses (`Unattempted`, `In Progress`, `Needs Review`, `Mastered`), starred questions, custom hints, and typed solutions.
- **`uploads/`**: Stores your uploaded handwritten work, whiteboard screenshots, and canvas attachments.

---

### Why is this folder separate?

1. **Clean Repository Sharing**: The master course question sheets in `courses/` remain pristine and untainted. You can share this repository with classmates or on GitHub without committing your personal scratch work.
2. **Safe Git Updates**: When pulling new course material or tutorial sheets, your local solutions in `userdata/` are never overwritten by git.
3. **Save & Load Portability**: You can instantly back up your entire learning progress as a single copy-pasteable string (`CNBACKUP:v1:...`) or download a `.json` save file from the **Save / Load** button in the web app navigation bar.
