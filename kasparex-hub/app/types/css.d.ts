// Type declarations for CSS imports with ?url suffix
declare module "*.css?url" {
  const url: string;
  export default url;
}

declare module "*.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

