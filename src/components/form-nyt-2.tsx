import assert from "assert";
import { Schema, Node } from "prosemirror-model";
import { EditorState, Transaction } from "prosemirror-state";
import "prosemirror-view/style/prosemirror.css";
import React, { useState, useEffect } from "react";
import { schema } from "prosemirror-schema-basic";
import {
  ProseMirror,
  useNodeViews,
  useEditorEventCallback,
  NodeViewComponentProps,
  react,
} from "@nytimes/react-prosemirror";

import { debounce } from "lodash";

const debouncedApply = debounce(({ state, type, data }) => {
  state.apply({type, data});
}, 1000, {leading: true, trailing: true});

// Paragraph is more or less a normal React component, taking and rendering
// its children. The actual children will be constructed by ProseMirror and
// passed in here. Take a look at the NodeViewComponentProps type to
// see what other props will be passed to NodeView components.
function Paragraph({ children }: NodeViewComponentProps) {
  // const onClick = useEditorEventCallback((view) => view.dispatch(whatever));
  // return <p onClick={onClick}>{children}</p>;
  return <p>{children}</p>;
}

// Make sure that your ReactNodeViews are defined outside of
// your component, or are properly memoized. ProseMirror will
// teardown and rebuild all NodeViews if the nodeView prop is
// updated, leading to unbounded recursion if this object doesn't
// have a stable reference.
const reactNodeViews = {
  paragraph: () => ({
    component: Paragraph,
    // We render the Paragraph component itself into a div element
    dom: document.createElement("div"),
    // We render the paragraph node's ProseMirror contents into
    // a span, which will be passed as children to the Paragraph
    // component.
    contentDOM: document.createElement("span"),
  }),
};

const initialEditorState = EditorState.create({
  schema,
  // You must add the react plugin if you use
  // the useNodeViews or useNodePos hook.
  plugins: [
    react()
  ],
});

export function Form({ state }) {
  const { nodeViews, renderNodeViews } = useNodeViews(reactNodeViews);
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [ editorState, setEditorState ] = useState(initialEditorState);
  const doc = editorState.doc.toJSON();
  useEffect(() => {
    debouncedApply({
      state,
      type: "change",
      data: {
        doc,
      },
    });
  }, [JSON.stringify(doc)]);
  return (
    <ProseMirror
      mount={mount}
      defaultState={editorState}
      nodeViews={nodeViews}
      state={editorState}
      dispatchTransaction={
        (tr) => {
          setEditorState(s => s.apply(tr));
        }
      }
    >
      <div ref={setMount} />
      {renderNodeViews()}
    </ProseMirror>
  );
}
