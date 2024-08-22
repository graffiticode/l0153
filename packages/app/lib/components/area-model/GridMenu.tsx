import type { MarkType } from "prosemirror-model";
import type { EditorState } from "prosemirror-state";
import type { ReactNode } from "react";
import {
  addColumnAfter,
//   addColumnBefore,
  deleteColumn,
  addRowAfter,
//   addRowBefore,
  deleteRow,
//   mergeCells,
//   splitCell,
//   setCellAttr,
//   toggleHeaderRow,
//   toggleHeaderColumn,
//   toggleHeaderCell,
//  goToNextCell,
//   deleteTable,
} from 'prosemirror-tables';

import { useEditorEventCallback, useEditorState } from "@nytimes/react-prosemirror";

const ArrowDown = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
  <path fillRule="evenodd" d="M8 2a.75.75 0 0 1 .75.75v8.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.22 3.22V2.75A.75.75 0 0 1 8 2Z" clipRule="evenodd" />
</svg>

const ArrowUp = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
  <path fillRule="evenodd" d="M8 14a.75.75 0 0 1-.75-.75V4.56L4.03 7.78a.75.75 0 0 1-1.06-1.06l4.5-4.5a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06L8.75 4.56v8.69A.75.75 0 0 1 8 14Z" clipRule="evenodd" />
</svg>

const ArrowRight = () =>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
  <path fillRule="evenodd" d="M2 8a.75.75 0 0 1 .75-.75h8.69L8.22 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06-1.06l3.22-3.22H2.75A.75.75 0 0 1 2 8Z" clipRule="evenodd" />
</svg>

const ArrowLeft = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
  <path fillRule="evenodd" d="M14 8a.75.75 0 0 1-.75.75H4.56l3.22 3.22a.75.75 0 1 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 0 1 1.06 1.06L4.56 7.25h8.69A.75.75 0 0 1 14 8Z" clipRule="evenodd" />
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

  const addCol = useEditorEventCallback((view) => {
    addColumnAfter(view.state, view.dispatch);
  });

  const delRow = useEditorEventCallback((view) => {
    deleteRow(view.state, view.dispatch);
  });

  const delCol = useEditorEventCallback((view) => {
    deleteColumn(view.state, view.dispatch);
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
          className="addcol"
          title="Add column"
          isActive={isMarkActive(state.schema.marks["em"], state)}
          onClick={addCol}
        >
          <ArrowRight />
        </Button>
        <Button
          className="delcol"
          title="Delete column"
          isActive={isMarkActive(state.schema.marks["em"], state)}
          onClick={delCol}
        >
          <ArrowLeft />
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
