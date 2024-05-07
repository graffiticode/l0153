import type { MarkType } from "prosemirror-model";
import type { EditorState } from "prosemirror-state";
import type { ReactNode } from "react";
import {
  addRowAfter,
  deleteRow,
} from 'prosemirror-tables';

import { useEditorEventCallback, useEditorState } from "@nytimes/react-prosemirror";

const ArrowDown = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
</svg>

const ArrowUp = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
</svg>

// lifted from:
// https://github.com/ProseMirror/prosemirror-example-setup/blob/master/src/menu.ts#L58
function isMarkActive(mark: MarkType, state: EditorState): boolean {
  const { from, $from, to, empty } = state.selection;
  return empty
    ? !!mark.isInSet(state.storedMarks || $from.marks())
    : state.doc.rangeHasMark(from, to, mark);
}

export function Button(props: {
  className?: string;
  children?: ReactNode;
  isActive: boolean;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={props.title}
      aria-pressed={props.isActive}
      className={`button ${props.className}`}
      onClick={props.onClick}
    >
      <span className="visually-hidden">{props.title}</span>
      <span aria-hidden>{props.children}</span>
    </button>
  );
}

export default function Menu({ showGridButtons }) {
  const state = useEditorState();

  const addRow = useEditorEventCallback((view) => {
    addRowAfter(view.state, view.dispatch);
  });

  const delRow = useEditorEventCallback((view) => {
    deleteRow(view.state, view.dispatch);
  });

  return (
    !showGridButtons &&
      <div /> ||
      <div className="menu">
        <Button
          className="addrow"
          title="Add row"
          isActive={isMarkActive(state.schema.marks["em"], state)}
          onClick={addRow}
        >
          <ArrowDown />
        </Button>
        <Button
          className="delrow"
          title="Delete row"
          isActive={isMarkActive(state.schema.marks["em"], state)}
          onClick={delRow}
        >
          <ArrowUp />
        </Button>
      </div>
  );
}
