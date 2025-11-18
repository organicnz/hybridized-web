---
inclusion: always
---

# Styling Guidelines

## Tailwind CSS Patterns

### Brand Colors

Use the established gradient palette:
- **Purple**: `purple-400`, `purple-500`, `purple-900`
- **Pink**: `pink-400`, `pink-500`
- **Blue**: `blue-400`, `blue-900`
- **Yellow/Orange**: `yellow-400`, `orange-400` (for CTAs)

### Common Patterns

**Gradient Backgrounds**
```tsx
className="bg-gradient-to-br from-purple-900 via-black to-blue-900"
className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400"
```

**Glassmorphism**
```tsx
className="bg-white/10 backdrop-blur-sm border border-white/20"
className="bg-black/80 backdrop-blur-md"
```

**Interactive Elements**
```tsx
className="hover:scale-105 transition-transform"
className="hover:bg-white/20 transition-colors"
className="group-hover:from-purple-500/10"
```

**Text Gradients**
```tsx
className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
```

## CSS Variables

Use HSL-based CSS variables defined in `globals.css`:
- `--background`, `--foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--accent`, `--destructive`
- `--border`, `--input`, `--ring`
- `--radius` for border radius consistency

Access via Tailwind: `bg-background`, `text-foreground`, etc.

## shadcn/ui Integration

- Components configured in `components.json`
- Use `cn()` utility from `@/lib/utils` for conditional classes
- Base color: slate
- CSS variables enabled for theming
- No prefix on Tailwind classes

```tsx
import { cn } from '@/lib/utils'

<div className={cn("base-classes", condition && "conditional-classes")} />
```

## Responsive Design

- Mobile-first approach
- Use Tailwind breakpoints: `md:`, `lg:`, `xl:`
- Test on mobile, tablet, and desktop
- Hide/show navigation on mobile: `hidden md:flex`

## Animation

- Use Framer Motion for complex animations
- Use Tailwind transitions for simple hover effects
- `tailwindcss-animate` plugin available for keyframe animations
- Keep animations subtle and performant

## Accessibility

- Maintain color contrast ratios
- Use semantic HTML elements
- Include hover and focus states
- Test keyboard navigation
- Provide alt text for images
