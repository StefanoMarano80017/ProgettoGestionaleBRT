/**
 * Custom ESLint rule: jsx-single-line-box
 * Collapses certain JSX elements (e.g., <Box ...><Child/></Box>) into one line
 * when they meet "non complex" criteria:
 *  - Element name matches configurable allowlist (default: Box)
 *  - Has only an sx prop (or only simple literal props)
 *  - sx object has <= maxProps (default 5) and only simple key:value pairs
 *  - Exactly one child element or expression with no trailing siblings
 *  - Child is a single self-closing component or plain text expression <= maxChildLength chars
 *
 * Auto-fixer rewrites to: <Box sx={{ ... }}><Child /></Box>
 */

import { RuleTester } from 'eslint';

export const rules = {
  'jsx-single-line-box': {
    meta: {
      type: 'layout',
      docs: { description: 'Collapse simple Box wrappers to a single line', recommended: false },
      fixable: 'code',
      schema: [
        {
          type: 'object',
          properties: {
            elements: { type: 'array', items: { type: 'string' }, default: ['*'] },
            maxProps: { type: 'number', default: 6 },
            maxChildLength: { type: 'number', default: 120 },
          },
          additionalProperties: false,
        },
      ],
      messages: {
        collapse: 'Collapse simple {{name}} wrapper to a single line.',
      },
    },
    create(context) {
      const config = context.options[0] || {};
  const elements = config.elements || ['*'];
      const maxProps = config.maxProps ?? 6;
      const maxChildLength = config.maxChildLength ?? 120;

      function isSimpleSx(node) {
        if (!node || node.type !== 'JSXExpressionContainer') return false;
        const expr = node.expression;
        if (expr.type !== 'ObjectExpression') return false;
        if (expr.properties.length > maxProps) return false;
        return expr.properties.every(p => p.type === 'Property' && p.key.type === 'Identifier');
      }

      function sourceText(node) {
        return context.getSourceCode().getText(node);
      }

      return {
        JSXElement(node) {
          const opening = node.openingElement;
          const name = opening.name && opening.name.name;
          if (!name) return;
          if (!(elements.includes('*') || elements.includes(name))) return;
          if (node.children.length !== 1) return;

            // Skip if already single line
          const loc = node.loc;
          if (loc.start.line === loc.end.line) return;

          // Only allow props: sx or simple literal/identifier props
          for (const attr of opening.attributes) {
            if (attr.type !== 'JSXAttribute') return; // no spreads
            if (attr.name.name === 'sx') {
              if (!isSimpleSx(attr.value)) return;
            } else {
              // allow boolean shorthand or literal values
              if (
                attr.value &&
                attr.value.type !== 'Literal' &&
                !(attr.value.type === 'JSXExpressionContainer' && attr.value.expression.type === 'Identifier')
              ) {
                return;
              }
            }
          }

          const child = node.children[0];
          if (child.type === 'JSXText') {
            const text = child.value.trim();
            if (!text || text.length > maxChildLength) return;
          } else if (child.type === 'JSXElement') {
            if (!child.openingElement.selfClosing) return; // only self-closing child
          } else if (child.type === 'JSXExpressionContainer') {
            const len = sourceText(child).length;
            if (len > maxChildLength) return;
          } else {
            return;
          }

          context.report({
            node,
            messageId: 'collapse',
            data: { name },
            fix(fixer) {
              const code = sourceText(node);
              // Remove newlines inside by collapsing whitespace sequences to single space
              const single = code
                .replace(/\n+/g, ' ')
                .replace(/\s{2,}/g, ' ')
                .replace(/> </g, '><')
                .trim();
              return fixer.replaceText(node, single);
            },
          });
        },
      };
    },
  },
};

export default { rules };
