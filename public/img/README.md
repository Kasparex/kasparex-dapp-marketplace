# Assets Directory

This directory contains all graphic assets for the Kasparex dApp Marketplace.

## Structure

```
public/img/
├── icons/      # SVG icon files for UI elements
└── logos/      # Logo files for networks, developers, and brands
```

## Adding Network Logos

Network logos should be placed in the `logos/` directory and referenced in the Sidebar component.

### Supported Formats
- SVG (preferred for scalability)
- PNG (with transparent background, minimum 32x32px)

### Current Network Logo Paths
- KRC-20: `/img/logos/krc20.svg`
- Kasplex L2: `/img/logos/kasplex.svg`
- Igra L2: `/img/logos/igra.svg`

### Adding New Network Logos

1. Place the logo file in `public/img/logos/`
2. Update the `networkOptions` array in `src/components/Sidebar.tsx` to include the logo path

Example:
```typescript
{ label: 'Network Name', logo: '/img/logos/network-name.svg' }
```

## Icon Guidelines

- Icons should be single-color outlines
- Use consistent stroke width (2px recommended)
- Maintain 24x24 viewBox for consistency
- Icons should work in both light and dark themes

