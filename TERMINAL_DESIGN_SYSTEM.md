# Terminal-Style Design System

## Overview
This design system creates a modern web adaptation of classic terminal interfaces, inspired by btop/bashtop and traditional terminal applications. It balances authentic terminal aesthetics with contemporary web usability.

## Design Principles

### 1. Terminal Authenticity
- Monospace typography for all technical content
- Box-drawing characters for borders and structure
- Classic terminal color schemes (green, amber, cyan on dark backgrounds)
- Consistent character-based spacing and alignment

### 2. Modern Web Usability
- Responsive design that works across screen sizes
- Proper contrast ratios for accessibility
- Touch-friendly interaction targets
- Smooth transitions and micro-interactions

### 3. Visual Hierarchy
- Clear distinction between different content types
- Consistent sizing and spacing patterns
- Proper use of color for status and categorization

## Color System

### Terminal Color Palette
```css
:root {
  /* Terminal Base Colors */
  --terminal-bg: 220 6% 6%;           /* Deep terminal black */
  --terminal-fg: 120 100% 85%;        /* Bright terminal green */
  --terminal-border: 120 100% 50%;    /* Neon green borders */
  
  /* Terminal Status Colors */
  --terminal-success: 120 100% 50%;   /* Bright green */
  --terminal-warning: 45 93% 58%;     /* Amber/yellow */
  --terminal-error: 0 100% 60%;       /* Bright red */
  --terminal-info: 180 100% 50%;      /* Cyan */
  --terminal-muted: 120 20% 40%;      /* Dim green */
  
  /* Terminal Accent Colors */
  --terminal-primary: 120 100% 50%;   /* Bright green */
  --terminal-secondary: 180 100% 50%; /* Cyan */
  --terminal-accent: 45 93% 58%;      /* Amber */
}
```

### Color Usage Guidelines
- **Primary Green**: Main interactive elements, borders, highlights
- **Cyan**: Secondary actions, links, metadata
- **Amber**: Warnings, important information
- **Red**: Errors, destructive actions
- **Muted Green**: Disabled states, secondary text

## Typography System

### Font Stack
```css
--font-terminal: 'Fira Code', 'Monaco', 'Cascadia Code', 'SF Mono', 'Consolas', 'Liberation Mono', 'Menlo', monospace;
```

### Typography Scale
```css
/* Terminal Typography Scale */
--text-xs: 0.75rem;    /* 12px - Small labels, metadata */
--text-sm: 0.875rem;   /* 14px - Body text, descriptions */
--text-base: 1rem;     /* 16px - Default text size */
--text-lg: 1.125rem;   /* 18px - Headings, emphasis */
--text-xl: 1.25rem;    /* 20px - Large headings */
--text-2xl: 1.5rem;    /* 24px - Major headings */
```

### Typography Usage
- All text uses monospace font for consistency
- Line height: 1.5 for readability
- Letter spacing: 0.025em for better character definition

## Spacing System

### Base Spacing Scale
```css
/* Terminal Spacing (based on character width) */
--space-1: 0.25rem;    /* 4px - Tight spacing */
--space-2: 0.5rem;     /* 8px - Small gaps */
--space-3: 0.75rem;    /* 12px - Default spacing */
--space-4: 1rem;       /* 16px - Medium spacing */
--space-6: 1.5rem;     /* 24px - Large spacing */
--space-8: 2rem;       /* 32px - Section spacing */
```

### Spacing Guidelines
- Use consistent spacing multiples
- Maintain character-based alignment
- Ensure touch targets are minimum 44px

## Border System

### Box Drawing Characters
```css
/* ASCII-style borders using CSS */
.terminal-border-top { border-top: 1px solid var(--terminal-border); }
.terminal-border-bottom { border-bottom: 1px solid var(--terminal-border); }
.terminal-border-left { border-left: 1px solid var(--terminal-border); }
.terminal-border-right { border-right: 1px solid var(--terminal-border); }
.terminal-border { border: 1px solid var(--terminal-border); }

/* Corner styles for terminal boxes */
.terminal-corners-rounded { border-radius: 0.25rem; }
.terminal-corners-sharp { border-radius: 0; }
```

### Border Usage
- Use consistent border colors
- Prefer sharp corners for authentic terminal feel
- Use borders to create visual sections and hierarchy

## Icon System

### Icon Sizing
```css
/* Terminal Icon Sizes */
--icon-xs: 0.75rem;    /* 12px */
--icon-sm: 1rem;       /* 16px */
--icon-base: 1.25rem;  /* 20px */
--icon-lg: 1.5rem;     /* 24px */
--icon-xl: 2rem;       /* 32px */
```

### Icon Guidelines
- Constrain both width and height
- Use consistent sizing across components
- Prefer text-based icons or simple SVGs
- Emoji icons should be sized consistently

## Component Specifications

### TerminalBox
- Container component with terminal-style borders
- Consistent padding and spacing
- Optional header with title
- Scrollable content area

### TerminalButton
- Monospace text
- Terminal color scheme
- Consistent sizing and spacing
- Hover and focus states

### TerminalIcon
- Consistent sizing system
- Proper emoji handling
- Fallback for missing icons
- Accessibility considerations

### TerminalText
- Typography hierarchy
- Color variants for different content types
- Proper line height and spacing

### TerminalInput
- Terminal-style form elements
- Consistent border and spacing
- Focus states with terminal colors
- Monospace input text

## Responsive Design

### Breakpoints
```css
/* Terminal-friendly breakpoints */
--breakpoint-sm: 640px;   /* Small screens */
--breakpoint-md: 768px;   /* Medium screens */
--breakpoint-lg: 1024px;  /* Large screens */
--breakpoint-xl: 1280px;  /* Extra large screens */
```

### Responsive Guidelines
- Maintain terminal aesthetic across all sizes
- Adjust spacing and sizing proportionally
- Ensure touch targets remain accessible
- Preserve monospace alignment

## Accessibility

### Contrast Requirements
- Minimum 4.5:1 contrast ratio for normal text
- Minimum 3:1 contrast ratio for large text
- High contrast mode support

### Focus Management
- Visible focus indicators using terminal colors
- Logical tab order
- Keyboard navigation support

### Screen Reader Support
- Proper semantic markup
- ARIA labels where needed
- Alternative text for visual elements

## Implementation Notes

### CSS Custom Properties
All design tokens should be implemented as CSS custom properties for easy theming and maintenance.

### Component Architecture
- Use Vue 3 composition API
- Implement proper TypeScript types
- Follow single responsibility principle
- Ensure components are reusable and composable

### Performance Considerations
- Minimize CSS bundle size
- Use efficient selectors
- Optimize for rendering performance
- Consider reduced motion preferences
