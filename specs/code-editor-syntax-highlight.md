# Spec: Code Editor com Syntax Highlighting

## Status das decisões

| Pergunta | Decisão |
|---|---|
| Comportamento quando auto-detecção erra | Badge "detectado: X" com botão de trocar |
| Tema Shiki | `"vesper"` (mesmo do `CodeBlockCode`) |
| Filename do header | Dinâmico — reflete extensão da linguagem detectada |
| Trigger da auto-detecção | Apenas no evento `onPaste` |
| Escopo de linguagens | Web + Backend popular (ver lista abaixo) |

---

## Contexto

O DevRoast já possui dois componentes relacionados a código:

- **`CodeEditorInput`** (`src/components/code-editor.tsx`) — editor com `<textarea>` simples, sem highlight. Usado na homepage para o usuário colar o código.
- **`CodeBlockCode`** (`src/components/ui/code-block.tsx`) — componente RSC display-only que já usa **Shiki** para renderizar código com highlighting nos resultados de análise.

O projeto já tem **Shiki v4** como dependência instalada. A feature a ser construída é adicionar syntax highlighting em tempo real no `CodeEditorInput`, sem trocar o `<textarea>` por um editor externo pesado.

---

## Decisão de Arquitetura

**Shiki + Textarea Overlay**, mesma pattern do [ray.so](https://github.com/raycast/ray-so).

- Um `<textarea>` invisível (texto transparente, caret branco) captura o input normalmente
- Um `<div>` com o HTML gerado pelo Shiki fica absolutamente posicionado atrás, com `pointer-events: none`
- Ambos compartilham fonte, `line-height`, `padding` e `font-size` idênticos
- Shiki já está no projeto — zero nova dependência para o rendering

**Para auto-detecção:** `highlight.js` usado apenas para `hljs.highlightAuto()` (só detecção, não rendering). Import seletivo com apenas as linguagens suportadas para manter o bundle pequeno.

---

## Linguagens suportadas

Foco em **Web + Backend popular**:

| ID Shiki | ID hljs | Label | Extensão |
|---|---|---|---|
| `javascript` | `javascript` | JavaScript | `.js` |
| `typescript` | `typescript` | TypeScript | `.ts` |
| `jsx` | `javascript` | JSX | `.jsx` |
| `tsx` | `typescript` | TSX | `.tsx` |
| `html` | `xml` | HTML | `.html` |
| `css` | `css` | CSS | `.css` |
| `python` | `python` | Python | `.py` |
| `java` | `java` | Java | `.java` |
| `csharp` | `csharp` | C# | `.cs` |
| `php` | `php` | PHP | `.php` |
| `ruby` | `ruby` | Ruby | `.rb` |
| `go` | `go` | Go | `.go` |
| `rust` | `rust` | Rust | `.rs` |
| `kotlin` | `kotlin` | Kotlin | `.kt` |
| `swift` | `swift` | Swift | `.swift` |
| `sql` | `sql` | SQL | `.sql` |
| `bash` | `bash` | Bash | `.sh` |
| `json` | `json` | JSON | `.json` |
| `yaml` | `yaml` | YAML | `.yaml` |

---

## Comportamento detalhado

### Auto-detecção (on paste)

1. Usuário cola o código → dispara `onPaste`
2. `detect-language.ts` chama `hljs.highlightAuto(code, [...supportedHljsIds])`
3. Retorna `{ lang: string; confidence: number }`
4. Se `confidence >= threshold` (definir em testes): define `language` no state e seta `isAutoDetected = true`
5. Se `confidence < threshold`: mantém a linguagem anterior ou cai para `"javascript"` como fallback

### Badge de linguagem detectada

Aparece no `CodeEditorHeader`, lado direito:

```
[ ● ● ● ]  paste.js             [ ✦ JavaScript ▾ ]
```

- O ícone `✦` (ou similar) indica que foi auto-detectado
- Clicar abre dropdown para seleção manual
- Ao selecionar manualmente: `isAutoDetected = false`, ícone some, badge mostra só a linguagem
- O filename (`paste.js`) atualiza dinamicamente conforme a extensão da linguagem

### Seleção manual via dropdown

- Dropdown com as 19 linguagens listadas acima
- Ao escolher: sobrescreve a detecção automática e trava nessa linguagem (mesmo em próximos pastes)
- Usuário pode resetar clicando em "auto-detect" como opção no dropdown (reset: `isAutoDetected = true`, roda detecção no código atual)

---

## Arquitetura de arquivos

```
src/
  components/
    code-editor.tsx              # Modificar: adicionar overlay + props de linguagem
    ui/
      language-selector.tsx      # Criar: badge + dropdown de linguagem
  lib/
    shiki-client.ts              # Criar: singleton do highlighter (client-side, WASM)
    detect-language.ts           # Criar: wrapper hljs.highlightAuto com linguagens suportadas
  app/
    home-client.tsx              # Modificar: states de linguagem, lógica de paste + highlight
```

---

## Contratos de interface (props/types)

### `detect-language.ts`

```ts
type DetectionResult = {
  lang: string;       // ID no formato Shiki (ex: "typescript")
  confidence: number; // 0–100, score retornado pelo hljs
};

export function detectLanguage(code: string): DetectionResult
```

### `shiki-client.ts`

```ts
// Singleton inicializado uma vez, reutilizado
export async function getHighlighter(): Promise<Highlighter>

export async function highlight(code: string, lang: string): Promise<string>
// retorna HTML gerado pelo Shiki com tema "vesper"
```

### `CodeEditorInput` (modificado)

```ts
type CodeEditorInputProps = {
  code: string;
  highlightedHtml?: string;  // novo
  onChange?: (value: string) => void;
  className?: string;
};
```

### `CodeEditorHeader` (modificado)

```ts
type CodeEditorHeaderProps = {
  filename?: string;          // agora dinâmico
  language?: string;
  isAutoDetected?: boolean;
  onLanguageChange?: (lang: string) => void;
  className?: string;
};
```

### `LanguageSelector`

```ts
type LanguageSelectorProps = {
  language: string;
  isAutoDetected: boolean;
  onLanguageChange: (lang: string) => void;
};
```

### Estado no `HomeClient`

```ts
const [code, setCode] = useState(SAMPLE_CODE);
const [language, setLanguage] = useState("javascript");
const [isAutoDetected, setIsAutoDetected] = useState(false);
const [highlightedHtml, setHighlightedHtml] = useState("");

// Re-highlight ao mudar code ou language
// Auto-detect só no onPaste
```

---

## Estrutura do overlay no `CodeEditorInput`

```tsx
<div className="relative flex-1 overflow-hidden">
  {/* Overlay Shiki — pointer-events none, atrás do textarea */}
  {highlightedHtml && (
    <div
      ref={overlayRef}
      aria-hidden="true"
      className="absolute inset-0 overflow-auto pointer-events-none
                 [&_pre]:m-0 [&_pre]:p-3 [&_pre]:bg-transparent!
                 [&_code]:text-sm [&_code]:leading-6 [&_code]:font-mono"
      dangerouslySetInnerHTML={{ __html: highlightedHtml }}
    />
  )}

  {/* Textarea — texto transparente, caret visível */}
  <textarea
    ref={textareaRef}
    className="absolute inset-0 w-full h-full bg-transparent resize-none
               outline-none p-3 text-sm leading-6 font-mono
               text-transparent caret-text-primary"
    value={code}
    onChange={(e) => onChange?.(e.target.value)}
    onPaste={onPaste}
    onScroll={syncScroll}
    spellCheck={false}
    autoComplete="off"
    autoCorrect="off"
    autoCapitalize="off"
  />
</div>
```

A sincronização de scroll é feita via `onScroll` no textarea que replica `scrollTop`/`scrollLeft` no overlay ref.

---

## To-dos de implementação

### Setup
- [ ] Instalar `highlight.js` e verificar como fazer import seletivo das linguagens suportadas

### `src/lib/detect-language.ts`
- [ ] Importar `hljs` core + as 19 linguagens mapeadas (via `hljs.registerLanguage`)
- [ ] Implementar `detectLanguage(code)` com mapeamento de IDs hljs → IDs Shiki
- [ ] Definir threshold de confiança mínima (testar empiricamente, sugestão inicial: `>= 5`)
- [ ] Exportar tabela `LANGUAGE_META` com `{ shikiId, hljsId, label, extension }` para reuso nos outros componentes

### `src/lib/shiki-client.ts`
- [ ] Criar singleton com `getHighlighterCore` + WASM (padrão do ray.so)
- [ ] Registrar as 19 linguagens suportadas com lazy load
- [ ] Usar tema `"vesper"`
- [ ] Exportar função `highlight(code, lang): Promise<string>`

### `src/components/ui/language-selector.tsx`
- [ ] Criar badge que mostra linguagem atual
- [ ] Adicionar ícone de "auto-detectado" quando `isAutoDetected = true`
- [ ] Usar `@base-ui-components/react` para o Popover/Select do dropdown
- [ ] Listar as 19 linguagens com label legível
- [ ] Adicionar opção "auto-detect" no topo do dropdown para resetar seleção manual

### `src/components/code-editor.tsx`
- [ ] Modificar `CodeEditorHeader` para aceitar props de linguagem e renderizar `LanguageSelector`
- [ ] Modificar `CodeEditorHeader` para receber `filename` dinâmico
- [ ] Modificar `CodeEditorInput` para aceitar `highlightedHtml` e `onPaste`
- [ ] Implementar estrutura de overlay (textarea absoluto sobre div de highlight)
- [ ] Implementar sincronização de scroll (`onScroll` → `overlayRef.current.scrollTop`)
- [ ] Garantir paridade de estilos: `font-size`, `line-height`, `padding`, `font-family` idênticos entre textarea e overlay

### `src/app/home-client.tsx`
- [ ] Adicionar states: `language`, `isAutoDetected`, `highlightedHtml`
- [ ] Implementar handler `handlePaste`: chama `detectLanguage`, atualiza state
- [ ] Implementar `handleLanguageChange`: seta `isAutoDetected = false`, troca linguagem
- [ ] `useEffect` em `[code, language]`: chama `highlight()` e atualiza `highlightedHtml`
- [ ] Derivar `filename` dinamicamente: `"paste" + LANGUAGE_META[language].extension`
- [ ] Passar todas as novas props para `CodeEditorRoot`, `CodeEditorHeader`, `CodeEditorInput`

### Testes manuais (casos edge)
- [ ] Snippet curto (1-2 linhas) — verificar comportamento quando detecção não tem confiança
- [ ] Código grande (500+ linhas) — garantir que não trava a UI
- [ ] Scroll longo — verificar sincronização do overlay
- [ ] Troca de linguagem manual + novo paste — garantir que a seleção manual não é sobrescrita

---

## Notas de implementação

- O `<textarea>` precisa ter `font-family: monospace` e os mesmos valores de `font-size`/`line-height` que o `<pre>` gerado pelo Shiki, caso contrário as linhas ficam desalinhadas
- O HTML do Shiki envolve o código em `<pre><code>...</code></pre>`. O CSS no overlay deve zerar margins/padding do `<pre>` e fazer o background transparente
- O `getHighlighterCore` é assíncrono — na primeira renderização `highlightedHtml` estará vazio. Nesse período o textarea deve mostrar o texto com `color: var(--color-text-primary)` (não transparente) como fallback até o highlighter estar pronto
- Ao usar `dangerouslySetInnerHTML` com output do Shiki, o risco de XSS é zero pois o Shiki escapa o conteúdo internamente
