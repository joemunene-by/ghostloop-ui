// Ambient declarations for stylesheet imports.
//
// Next.js handles CSS at the bundler level, but TypeScript 6.0 stopped
// resolving side-effect imports like `import "./globals.css"` without an
// explicit module declaration. This restores that for global and module CSS.
declare module "*.css";
declare module "*.scss";
