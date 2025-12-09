# 词汇学习游戏 / Vocabulary Learning Game

Interactive web-based vocabulary learning game for TOEFL and IELTS preparation.

## 🚀 Quick Start

### Option 1: Direct Browser (Simple)

1. Open `index.html` in your browser
2. Accept privacy notice
3. Start learning!

**Note**: Some browsers may block LocalStorage when opening files directly. If you see errors, use Option 2.

### Option 2: Local Server (Recommended)

```bash
# Navigate to prototype directory
cd specs/004-vocab-game-web/prototype/

# Option A: Using Python
python3 -m http.server 8080

# Option B: Using Node.js http-server
npx http-server -p 8080

# Option C: Using live-server (with auto-reload)
npx live-server --port=8080
```

Then open: `http://localhost:8080`

## 📁 Project Structure

```
prototype/
├── index.html              # Main entry point
├── css/                    # Stylesheets
│   ├── main.css           # Global styles
│   ├── course.css         # Course list styles
│   ├── game.css           # Quiz game styles
│   └── animations.css     # CSS animations
├── js/                    # JavaScript modules
│   ├── app.js            # Application bootstrap
│   ├── models/           # Data models
│   ├── services/         # Business logic
│   ├── components/       # UI components
│   └── utils/            # Helper utilities
├── data/                  # Vocabulary and course data
│   ├── toefl-vocab.json  # TOEFL vocabulary (12 words)
│   ├── ielts-vocab.json  # IELTS vocabulary (1 word)
│   └── courses.json      # Course definitions
└── assets/               # Media files
    ├── audio/            # Sound effects (see audio/README.md)
    └── images/           # Thumbnails and icons
```

## ✨ Features (MVP)

- ✅ Browse course series (TOEFL, IELTS)
- ✅ Interactive quiz games (Multiple Choice, Matching, Fill-in-Blank)
- ✅ Immediate feedback with animations and sound
- ✅ Learning statistics and results
- ✅ Progress saved in browser (LocalStorage)
- ✅ Responsive design (mobile and desktop)
- ✅ Privacy compliant (data stored locally only)

## 🎯 How to Use

1. **Browse Courses**: Select a course series on the home page
2. **Start Learning**: Click on a course to begin
3. **Answer Questions**: Complete interactive quiz questions
4. **Review Results**: See your learning statistics
5. **Track Progress**: Your progress is automatically saved

## 🔧 Development

### Install Dependencies

```bash
npm install
```

### Run Tests

```bash
# Unit tests (Jest)
npm test

# E2E tests (Playwright)
npm run test:e2e

# E2E with visible browser
npm run test:e2e:headed
```

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Android)

## 📊 Data Storage

- **Method**: Browser LocalStorage
- **Size**: ~900KB (well under 5MB limit)
- **Persistence**: Data persists until manually deleted
- **Privacy**: All data stored locally, never sent to servers

### View Storage

1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Look for keys starting with `vocab_`

### Clear Data

Go to Settings → Delete All Learning Data

## 🎨 Customization

### Adding Vocabulary

Edit `data/toefl-vocab.json` or `data/ielts-vocab.json`:

```json
{
  "id": "w-013",
  "word": "example",
  "phonetic": "/ɪɡˈzæm.pəl/",
  "partOfSpeech": "noun",
  "definitions": [
    {
      "chinese": "例子",
      "english": "A thing characteristic of its kind",
      "example": "This is a good example."
    }
  ],
  "source": "toefl",
  "difficultyLevel": 2,
  "tags": ["academic"]
}
```

### Adding Courses

Edit `data/courses.json` to add new courses and series.

See `contracts/` directory for complete data schemas.

## 🐛 Troubleshooting

### Issue: "Failed to initialize"

**Solution**: Make sure you're running with a local server (Option 2 above).

### Issue: No audio

**Solution**: Audio files are optional. Add .mp3 files to `assets/audio/` (see audio/README.md).

### Issue: Data not saving

**Solution**:
1. Check if browser supports LocalStorage
2. Check browser privacy settings (allow cookies/storage)
3. Clear browser cache and try again

### Issue: Course not loading

**Solution**: Check browser console (F12) for errors. Verify `data/*.json` files are valid JSON.

## 📝 License

MIT License - Free for educational use

## 🤝 Contributing

This is an MVP prototype. For improvements:
1. Check `../tasks.md` for planned features
2. Review `../spec.md` for requirements
3. Follow code style in existing files

## 📖 Documentation

- [Feature Specification](../spec.md)
- [Implementation Plan](../plan.md)
- [Data Model](../data-model.md)
- [API Contracts](../contracts/)
- [Task List](../tasks.md)
- [Quickstart Guide](../quickstart.md)

## 🎓 Learning Tips

- Complete courses in sequence (Course 1 → Course 2 → ...)
- Review results after each course
- Aim for 75%+ accuracy
- Take breaks between courses (spaced repetition)
- Check Settings to monitor storage usage

---

**Version**: 1.0.0 (MVP)
**Last Updated**: 2025-12-08
