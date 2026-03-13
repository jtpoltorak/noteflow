import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

/** Languages available in lowlight's `common` bundle, sorted for the dropdown. */
const LANGUAGES: { value: string; label: string }[] = [
  { value: '', label: 'Auto-detect' },
  { value: 'bash', label: 'Bash' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'css', label: 'CSS' },
  { value: 'diff', label: 'Diff' },
  { value: 'go', label: 'Go' },
  { value: 'graphql', label: 'GraphQL' },
  { value: 'ini', label: 'INI' },
  { value: 'java', label: 'Java' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'json', label: 'JSON' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'less', label: 'Less' },
  { value: 'lua', label: 'Lua' },
  { value: 'makefile', label: 'Makefile' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'objectivec', label: 'Objective-C' },
  { value: 'perl', label: 'Perl' },
  { value: 'php', label: 'PHP' },
  { value: 'plaintext', label: 'Plain Text' },
  { value: 'python', label: 'Python' },
  { value: 'r', label: 'R' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'rust', label: 'Rust' },
  { value: 'scss', label: 'SCSS' },
  { value: 'shell', label: 'Shell' },
  { value: 'sql', label: 'SQL' },
  { value: 'swift', label: 'Swift' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'xml', label: 'XML / HTML' },
  { value: 'yaml', label: 'YAML' },
];

/**
 * Extends CodeBlockLowlight with a language selector dropdown rendered via a
 * custom NodeView. The `<select>` sits in the top-right corner of the code block.
 */
export const CodeBlockWithLanguage = CodeBlockLowlight.extend({
  addNodeView() {
    return ({ node, editor, getPos }) => {
      // Wrapper: the outer container
      const wrapper = document.createElement('div');
      wrapper.classList.add('code-block-wrapper');

      // Language selector
      const select = document.createElement('select');
      select.classList.add('code-block-lang-select');
      select.contentEditable = 'false';

      for (const lang of LANGUAGES) {
        const opt = document.createElement('option');
        opt.value = lang.value;
        opt.textContent = lang.label;
        select.appendChild(opt);
      }

      // Set current value from node attrs
      select.value = node.attrs['language'] ?? '';

      select.addEventListener('change', () => {
        const pos = getPos();
        if (typeof pos !== 'number') return;
        editor.chain().focus(pos + 1).updateAttributes('codeBlock', { language: select.value || null }).run();
      });

      // The <pre> element that TipTap renders code into
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      pre.appendChild(code);

      wrapper.appendChild(select);
      wrapper.appendChild(pre);

      return {
        dom: wrapper,
        contentDOM: code,
        update(updatedNode) {
          if (updatedNode.type.name !== 'codeBlock') return false;
          select.value = updatedNode.attrs['language'] ?? '';
          return true;
        },
      };
    };
  },
}).configure({
  lowlight,
});
