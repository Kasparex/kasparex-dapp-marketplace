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
- PNG (with transparent background, minimum 32x32px, default format)
- SVG (alternative format for scalability)

### Current Network Logo Paths
- KRC-20: `/img/logos/krc20.png`
- Kasplex L2: `/img/logos/kasplex.png`
- Igra L2: `/img/logos/igra.png`

### Adding New Network Logos

1. Place the logo file in `public/img/logos/`
2. Update the `networkOptions` array in `src/components/Sidebar.tsx` to include the logo path

Example:
```typescript
{ label: 'Network Name', logo: '/img/logos/network-name.png' }
```

## Adding Developer Logos

Developer logos should be placed in the `logos/` directory and will display next to developer names in the Developer filter section.

### Supported Formats
- PNG (with transparent background, minimum 32x32px, default format)
- SVG (alternative format for scalability)

### Current Developer Logo Paths
- Kasparex: `/img/logos/kasparex.png`
- KaspaCom: `/img/logos/kaspacom.png`
- KasFyi: `/img/logos/kasfyi.png`
- KasTools: `/img/logos/kastools.png`
- Kasplex: `/img/logos/kasplex.png`

### Adding New Developer Logos

1. Place the logo file in `public/img/logos/`
2. Update the `developerOptions` array in `src/components/Sidebar.tsx` to include the logo path

Example:
```typescript
{ label: 'Developer Name', logo: '/img/logos/developer-name.png' }
```

## Icon Guidelines

- Icons should be single-color outlines
- Use consistent stroke width (2px recommended)
- Maintain 24x24 viewBox for consistency
- Icons should work in both light and dark themes

