'use client';
import React from 'react';

interface Props {
  /** Human label for the failing unit, e.g. the block or widget type. */
  label: string;
  /** Only show the diagnostic card in edit/preview mode; stay invisible on the live site. */
  editMode?: boolean;
  /** Changes when the unit's content changes — clears a previous error so a fix can re-render. */
  resetKey?: string;
  children: React.ReactNode;
}
interface State {
  error: Error | null;
  key?: string;
}

const STRING_OP_RE =
  /\.(split|replace|match|slice|indexOf|lastIndexOf|toUpperCase|toLowerCase|trim|trimStart|trimEnd|charAt|charCodeAt|startsWith|endsWith|padStart|padEnd|substring|substr|normalize|repeat) is not a function/;

/**
 * Wraps a single block/widget so one bad component can't white-screen the whole
 * preview. In edit mode it renders a readable diagnostic (what broke + why) so an
 * editor can fix it; on the live site it renders nothing for the failing unit.
 */
export class RenderErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, key: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    // content changed (e.g. the editor fixed the field) → clear the error and retry
    if (props.resetKey !== state.key) return { error: null, key: props.resetKey };
    return null;
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (!this.props.editMode) return null; // never break the live site

    const msg = error.message || String(error);
    const isRich = STRING_OP_RE.test(msg);
    return (
      <div
        style={{
          margin: '8px 0',
          padding: '12px 14px',
          border: '1px solid #fecaca',
          background: '#fef2f2',
          borderRadius: 8,
          color: '#991b1b',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 4 }}>
          ⚠ &ldquo;{this.props.label}&rdquo; couldn&rsquo;t render
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#7f1d1d', whiteSpace: 'pre-wrap' }}>{msg}</div>
        {isRich && (
          <div style={{ marginTop: 8, color: '#9a3412' }}>
            A rich-text field here holds formatting this section reads as plain text. Fix: clear that
            field&rsquo;s formatting, or update this component to render the field directly (it needs a
            <code style={{ background: '#fee2e2', padding: '0 4px', borderRadius: 3, margin: '0 2px' }}>
              typeof x !== &quot;string&quot;
            </code>
            guard). The rest of the page is unaffected.
          </div>
        )}
      </div>
    );
  }
}
