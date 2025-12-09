# Audio Files

This directory should contain sound effect files for the vocabulary learning game.

## Required Files

1. **correct.mp3** - Played when user answers correctly
   - Suggested: Pleasant "ding" or "success" sound
   - Duration: ~0.5-1 second
   - Sources: [freesound.org](https://freesound.org), [zapsplat.com](https://zapsplat.com)

2. **incorrect.mp3** - Played when user answers incorrectly
   - Suggested: Gentle "buzz" or "try again" sound (not harsh)
   - Duration: ~0.5-1 second
   - Sources: [freesound.org](https://freesound.org), [zapsplat.com](https://zapsplat.com)

3. **complete.mp3** - Played when course is completed
   - Suggested: Celebratory "fanfare" or "achievement" sound
   - Duration: ~1-2 seconds
   - Sources: [freesound.org](https://freesound.org), [zapsplat.com](https://zapsplat.com)

## Fallback Behavior

If audio files are missing, the application will:
- Continue working without sound
- Show visual feedback only
- Log warnings in console (not errors)

This is by design (graceful degradation per research.md).

## Testing Without Audio

The app works perfectly fine without audio files for testing purposes. The AudioManager will simply skip playback if files are not found.

## Adding Your Own Sounds

1. Place .mp3 files in this directory with the exact names above
2. Ensure files are small (<50KB each) for fast loading
3. Test that sounds are not too loud (volume controlled in app at 70%)
4. Refresh the application to load new sounds

## License Notes

If using sounds from free sources:
- Check license requirements (most allow free use with attribution)
- Add attribution in this README if required
- Ensure sounds are royalty-free for educational use
