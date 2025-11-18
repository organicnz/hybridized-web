# Spotify-Inspired Theme - Hybridized

## Color Palette

### Primary Colors
- **Background**: `#121212` (zinc-950) - Deep black
- **Surface**: `#181818` (zinc-900) - Dark gray
- **Card Background**: `rgba(24, 24, 24, 0.5)` - Semi-transparent dark
- **Accent Green**: `#1DB954` (green-400) - Spotify green

### Text Colors
- **Primary Text**: `#FFFFFF` - White
- **Secondary Text**: `rgba(255, 255, 255, 0.7)` - 70% white
- **Muted Text**: `rgba(255, 255, 255, 0.5)` - 50% white
- **Disabled Text**: `rgba(255, 255, 255, 0.3)` - 30% white

### Interactive Elements
- **Hover State**: `rgba(255, 255, 255, 0.1)` - 10% white overlay
- **Active State**: `rgba(255, 255, 255, 0.2)` - 20% white overlay
- **Focus Ring**: Green-400 with 50% opacity

### Borders
- **Subtle Border**: `rgba(255, 255, 255, 0.05)` - 5% white
- **Medium Border**: `rgba(255, 255, 255, 0.1)` - 10% white

## Component Styling

### Header
- Background: Black with 95% opacity + backdrop blur
- Logo: Green-to-emerald gradient
- Navigation: White text with green underline on hover
- Search: White/10 background with rounded-full shape

### Artist Navigation
- Background: Zinc-900/50 with backdrop blur
- Active tab: Green-400 bottom border
- Inactive tabs: White/60 text, hover to white

### Now Playing Card
- Background: Gradient from zinc-900 to zinc-800
- Border: White/10
- Progress bar: Green-400
- Play button: Green-400 background with black icon
- Hover effects: Scale and color transitions

### Mix List Items
- Background: Zinc-900/50 with backdrop blur
- Border: White/5
- Hover: Zinc-800/70 background
- Title: White text, green on hover
- Play button: Green-400 with scale on hover
- Menu button: Appears on hover

### Artist Profile
- Background: Zinc-900/50 with backdrop blur
- Border: White/10
- Hero gradient: Green-to-emerald
- Text: White/70 for body

### Footer
- Background: Pure black
- Border: White/5
- Text: White/50
- Links: Underline on hover

## Design Principles

1. **Dark First**: Everything starts with dark backgrounds
2. **Green Accent**: Spotify's signature green for CTAs and active states
3. **Subtle Borders**: Use 5-10% white opacity for separation
4. **Glassmorphism**: Backdrop blur with semi-transparent backgrounds
5. **Smooth Transitions**: All interactive elements have transitions
6. **Scale on Hover**: Buttons scale up slightly (105%) on hover
7. **Progressive Disclosure**: Secondary actions appear on hover
8. **High Contrast**: White text on dark backgrounds for readability

## Accessibility

- Maintains WCAG AA contrast ratios
- Focus states visible with green ring
- Semantic HTML elements
- ARIA labels on interactive elements
- Keyboard navigation support
