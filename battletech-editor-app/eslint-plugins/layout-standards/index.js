/**
 * ESLint Plugin: Layout Standards
 * 
 * Custom ESLint rules to enforce consistent tab layout patterns
 * and prevent layout issues from hardcoded height calculations.
 */

module.exports = {
  rules: {
    'no-hardcoded-tab-height': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prevent hardcoded calc() height values for tab content',
          category: 'Layout Standards',
          recommended: true
        },
        fixable: null,
        schema: []
      },
      create(context) {
        return {
          // Check for hardcoded calc() in style attributes
          JSXAttribute(node) {
            if (node.name.name === 'style' && node.value && node.value.type === 'JSXExpressionContainer') {
              const expression = node.value.expression;
              
              if (expression.type === 'ObjectExpression') {
                expression.properties.forEach(prop => {
                  if (prop.key && prop.key.name === 'height' && prop.value) {
                    if (prop.value.type === 'Literal') {
                      const heightValue = prop.value.value;
                      if (typeof heightValue === 'string' && heightValue.includes('calc(100vh -')) {
                        context.report({
                          node: prop,
                          message: 'Avoid hardcoded calc(100vh - X) heights. Use TabContentWrapper or TAB_CONTENT_HEIGHT constant instead.',
                          suggest: [{
                            desc: 'Replace with TabContentWrapper component',
                            fix(fixer) {
                              return fixer.replaceText(prop.value, 'TAB_CONTENT_HEIGHT');
                            }
                          }]
                        });
                      }
                    }
                  }
                });
              }
            }
          },
          
          // Check for hardcoded heights in className
          JSXAttribute(node) {
            if (node.name.name === 'className' && node.value) {
              const classValue = node.value.value || (node.value.expression && node.value.expression.value);
              if (typeof classValue === 'string' && classValue.includes('h-screen')) {
                context.report({
                  node,
                  message: 'Avoid h-screen for tab content. Use TabContentWrapper for consistent scrolling behavior.'
                });
              }
            }
          }
        };
      }
    },

    'use-layout-constants': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Encourage use of layout constants from utils/layout/constants',
          category: 'Layout Standards',
          recommended: true
        },
        fixable: null,
        schema: []
      },
      create(context) {
        let hasLayoutImport = false;
        
        return {
          ImportDeclaration(node) {
            if (node.source.value.includes('utils/layout/constants')) {
              hasLayoutImport = true;
            }
          },
          
          Literal(node) {
            if (typeof node.value === 'string') {
              // Check for hardcoded height values that should use constants
              if (node.value.match(/calc\(100vh\s*-\s*140px\)/)) {
                if (!hasLayoutImport) {
                  context.report({
                    node,
                    message: 'Import TAB_CONTENT_HEIGHT from utils/layout/constants instead of hardcoding calc(100vh - 140px).',
                    suggest: [{
                      desc: 'Add layout constants import',
                      fix(fixer) {
                        const sourceCode = context.getSourceCode();
                        const imports = sourceCode.ast.body.filter(n => n.type === 'ImportDeclaration');
                        const lastImport = imports[imports.length - 1];
                        
                        if (lastImport) {
                          return fixer.insertTextAfter(lastImport, '\nimport { TAB_CONTENT_HEIGHT } from \'../../utils/layout/constants\';');
                        }
                      }
                    }]
                  });
                }
              }
            }
          }
        };
      }
    },

    'prefer-tab-wrapper': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Suggest using TabContentWrapper for tab content containers',
          category: 'Layout Standards',
          recommended: true
        },
        fixable: null,
        schema: []
      },
      create(context) {
        return {
          JSXElement(node) {
            // Look for div elements with overflow-auto and height calc patterns
            if (node.openingElement.name.name === 'div') {
              const classNameAttr = node.openingElement.attributes.find(
                attr => attr.name && attr.name.name === 'className'
              );
              const styleAttr = node.openingElement.attributes.find(
                attr => attr.name && attr.name.name === 'style'
              );
              
              let hasOverflowAuto = false;
              let hasHeightCalc = false;
              
              // Check className for overflow-auto
              if (classNameAttr && classNameAttr.value) {
                const classValue = classNameAttr.value.value || 
                  (classNameAttr.value.expression && classNameAttr.value.expression.value);
                if (typeof classValue === 'string' && classValue.includes('overflow-auto')) {
                  hasOverflowAuto = true;
                }
              }
              
              // Check style for height calc
              if (styleAttr && styleAttr.value && styleAttr.value.type === 'JSXExpressionContainer') {
                const expression = styleAttr.value.expression;
                if (expression.type === 'ObjectExpression') {
                  const heightProp = expression.properties.find(
                    prop => prop.key && prop.key.name === 'height'
                  );
                  if (heightProp && heightProp.value.value && 
                      heightProp.value.value.includes('calc(100vh')) {
                    hasHeightCalc = true;
                  }
                }
              }
              
              // If this looks like a manual tab content container, suggest TabContentWrapper
              if (hasOverflowAuto && hasHeightCalc) {
                context.report({
                  node,
                  message: 'This element appears to be a tab content container. Consider using TabContentWrapper for consistency.',
                  suggest: [{
                    desc: 'Replace with TabContentWrapper component',
                    fix(fixer) {
                      // This is a complex replacement, so we'll just provide a suggestion message
                      return null;
                    }
                  }]
                });
              }
            }
          }
        };
      }
    }
  }
};
