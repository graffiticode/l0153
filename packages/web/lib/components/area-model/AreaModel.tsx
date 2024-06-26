import type { NodeViewComponentProps } from "@nytimes/react-prosemirror";
import type { ReactNodeViewConstructor } from "@nytimes/react-prosemirror";

import GridEditor from "./GridEditor.js";
import ColumnEditor from "./ColumnEditor.js";
import "./AreaModel.css";

import 'prosemirror-view/style/prosemirror.css';
import 'prosemirror-menu/style/menu.css';
import 'prosemirror-example-setup/style/style.css';
import 'prosemirror-gapcursor/style/gapcursor.css';

import parse from 'html-react-parser';

function Paragraph({ children }: NodeViewComponentProps) {
  return <p onClick={() => console.log('click')}>{children}</p>;
}

export function ModelEditor({ state }) {
  const reactNodeViews: Record<string, ReactNodeViewConstructor> = {
    paragraph: () => ({
      component: Paragraph,
      dom: document.createElement("div"),
      contentDOM: document.createElement("div"),
    }),
  };
  return (
    <GridEditor state={state} reactNodeViews={reactNodeViews} />
  );
}

export function SumEditor({ state }) {
  const reactNodeViews: Record<string, ReactNodeViewConstructor> = {
    paragraph: () => ({
      component: Paragraph,
      dom: document.createElement("div"),
      contentDOM: document.createElement("div"),
    }),
  };
  return (
    <ColumnEditor state={state} reactNodeViews={reactNodeViews} />
  );
}

export function AreaModel({ state }) {
  return (
    (state === undefined || state.data === undefined) &&
    <div /> ||
    <>
      <div className="py-4">
        { state.data.problemStatement }
        <div className="p-4 text-4xl font-semibold text-slate-600">
          { state.data.html && parse(state.data.html) }
        </div>
      </div>
      <div className="grid gap-10 grid-cols-1 sm:grid-cols-2">
        <ModelEditor state={state} />
        <SumEditor state={state} />
      </div>
    </>
  );
}
