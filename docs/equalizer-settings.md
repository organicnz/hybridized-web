# Equalizer Settings Feature

## Overview

The audio player now includes persistent equalizer settings that are automatically saved to the database and restored when users return to the app.

## Database Schema

### Table: `equalizer_settings`

Stores user-specific equalizer configurations with the following columns:

- `id` (uuid): Primary key
- `user_id` (uuid): References auth.users, links settings to user account
- `preset_name` (text): Name of the preset (e.g., "Rock", "Jazz", "Custom")
- `gains` (jsonb): Array of 10 gain values for frequency bands (60Hz to 16kHz)
- `is_active` (boolean): Indicates the currently active setting (only one per user)
- `created_at` (timestamp): When the setting was created
- `updated_at` (timestamp): Last modification time

### Security

- Row Level Security (RLS) enabled
- Users can only view, insert, update, and delete their own settings
- Unique constraint ensures only one active setting per user

## Features

### Auto-Save

- Settings are automatically saved when:
  - User adjusts individual frequency sliders
  - User selects a preset (Rock, Pop, Jazz, etc.)
  - User resets the equalizer

### Auto-Load

- When the audio player initializes, it automatically loads the user's last saved settings
- Settings are applied to the Web Audio API filters on initialization
- Works seamlessly across sessions and devices

### Presets

Available presets:

- Flat (neutral)
- Rock
- Pop
- Jazz
- Classical
- Bass
- Treble
- Bass & Treble
- Electronic
- Hip Hop
- Vocal
- Acoustic

### Visual Feedback

- "Saving..." indicator appears when settings are being persisted
- Current preset name is displayed
- Custom preset is automatically selected when manually adjusting sliders

## Technical Implementation

### Components

- `AudioEqualizer` component handles all equalizer logic
- Uses Web Audio API's BiquadFilterNode for audio processing
- Integrates with Supabase for database operations

### Frequency Bands

10 frequency bands with specific filter types:

- 60Hz (lowshelf)
- 170Hz - 14kHz (peaking filters)
- 16kHz (highshelf)

### Database Operations

```typescript
// Load settings on mount
const { data } = await supabase
  .from('equalizer_settings')
  .select('*')
  .eq('user_id', user.id)
  .eq('is_active', true)
  .single();

// Save settings
await supabase
  .from('equalizer_settings')
  .insert({
    user_id: user.id,
    preset_name: 'Custom',
    gains: [0, 0, 0, ...],
    is_active: true,
  });
```

## User Experience

1. User opens the audio player and clicks the equalizer button
2. Previously saved settings are automatically applied
3. User adjusts sliders or selects a preset
4. Changes are instantly applied to audio and saved to database
5. Settings persist across sessions and devices

## Future Enhancements

Potential improvements:

- Multiple saved presets per user
- Preset sharing between users
- Per-track or per-genre equalizer settings
- Import/export equalizer configurations
