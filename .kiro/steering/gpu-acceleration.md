# GPU Acceleration Best Practices

## Overview

GPU acceleration has been implemented across the codebase to improve rendering performance, especially for animations, transforms, and backdrop blur effects.

## Available Utility Classes

### `.gpu`

Use for elements with transforms, scales, or position animations:

```tsx
<div className="hover:scale-105 transition-transform gpu">
```

### `.gpu-opacity`

Use for elements with opacity transitions or fade effects:

```tsx
<div className="opacity-0 hover:opacity-100 transition-opacity gpu-opacity">
```

### `.gpu-filter`

Use for elements with backdrop-blur or filter effects:

```tsx
<div className="backdrop-blur-md gpu-filter">
```

### `.smooth-scroll`

Use for scrollable containers on mobile:

```tsx
<div className="overflow-auto smooth-scroll">
```

## Automatic Optimization

The following classes are automatically GPU-accelerated:

- All `transform` classes
- All `transition` classes
- All `animate-` classes
- All `hover:scale-*` classes
- All `hover:translate-*` classes
- All `backdrop-blur-*` classes
- All `bg-gradient-*` classes

## When to Use Explicit Classes

Add explicit GPU classes when:

1. **Complex hover effects** - Multiple properties changing simultaneously
2. **Nested animations** - Parent and child elements both animating
3. **High-frequency updates** - Elements that change rapidly
4. **Mobile performance** - Critical path elements on mobile devices
5. **Dropdown menus** - Smooth open/close animations

## Implementation Examples

### Header with Sticky Position

```tsx
<header className="sticky top-0 backdrop-blur-md gpu-filter">
```

### Image with Hover Scale

```tsx
<img className="group-hover:scale-110 transition-transform gpu" />
```

### Dropdown Menu

```tsx
<div className="opacity-0 group-hover:opacity-100 transition-opacity gpu-opacity">
```

### Play Button with Scale

```tsx
<button className="hover:scale-110 transition-all gpu">
```

## Performance Tips

1. **Don't overuse** - Only apply to elements that actually animate
2. **Avoid on static elements** - No benefit for non-animated content
3. **Test on mobile** - GPU acceleration is most impactful on mobile devices
4. **Monitor performance** - Use Chrome DevTools Performance tab
5. **Combine classes** - Use multiple GPU classes when needed (e.g., `gpu gpu-opacity`)

## Browser Support

All GPU acceleration techniques are supported in:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

If you see performance issues:

1. Check for too many animated elements on screen
2. Reduce backdrop-blur intensity if needed
3. Use `will-change` sparingly (already included in utility classes)
4. Consider lazy loading off-screen animated content
