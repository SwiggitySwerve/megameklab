/**
 * Custom ESLint Rules for Layout Standards
 * 
 * This configuration adds custom rules to enforce consistent tab layout patterns
 * and prevent hardcoded height calculations that can cause layout issues.
 */

module.exports = {
  plugins: ['@battletech-editor/layout-standards'],
  rules: {
    // Enforce use of TabContentWrapper for tab content containers
    '@battletech-editor/layout-standards/no-hardcoded-tab-height': 'warn',
    
    // Enforce use of layout constants for height calculations
    '@battletech-editor/layout-standards/use-layout-constants': 'warn',
    
    // Warn about potential layout anti-patterns
    '@battletech-editor/layout-standards/prefer-tab-wrapper': 'warn'
  }
};
