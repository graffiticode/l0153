import type { NodeViewComponentProps } from "@nytimes/react-prosemirror";
import type { ReactNodeViewConstructor } from "@nytimes/react-prosemirror";

import GridEditor from "./GridEditor.js";
import ColumnEditor from "./ColumnEditor.js";
import "./Form.css";

import 'prosemirror-view/style/prosemirror.css';
import 'prosemirror-menu/style/menu.css';
import 'prosemirror-example-setup/style/style.css';
import 'prosemirror-gapcursor/style/gapcursor.css';

import katex from 'katex';
import parse from 'html-react-parser';

const buildCell = ({ col, row, attrs }) => {
  const cell = row[col];
  let content;
  let colspan = 1;
  let rowspan = 1;
  let background = "#fff";
  if (typeof cell === "object") {
    content = cell.doc.content;
    colspan = content[0].content[0].content.length;
    rowspan = content[0].content[0].length;
  } else {
    background = attrs.color;
    const text = String(row[col]);
    content = [
      {
        "type": "paragraph",
        "content": row[col] && [
          {
            "type": "text",
            text,
          }
        ]
      }
    ];
  }
  return ({
    "type": "table_cell",
    "attrs": {
      colspan,
      rowspan,
      "colwidth": null,
      "width": "50px",
      "height": "50px",
      background,
    },
    "content": content,
  });
};

const buildRow = ({ cols, row, attrs }) => {
  return ({
    "type": "table_row",
    "content": cols.map(col => {
      return buildCell({col, row, attrs});
    }),
  })
};

const buildTable = ({ cols, rows, attrs }) => {
  return ({
    "type": "table",
    "content": rows.map((row, rowIndex) => {
      return buildRow({cols, row, attrs: attrs[rowIndex]});
    })
  })
};

const buildGridDocFromTable = (table) => {
  const attrs = applyRules(table);
  return {
    "type": "doc",
    "content": [
      {
        ...buildTable({...table, attrs}),
      },
    ]
  }
};

const buildColumnDocFromTable = (table) => {
  const attrs = applyRules(table);
  return {
    "type": "doc",
    "content": [
      {
        ...buildTable({...table, attrs}),
      },
    ]
  }
};

const applyRules = ({ cols, rows }) => {
  const argsCols = cols.slice(0, cols.length - 1);
  const totalCol = cols[cols.length - 1];
  const rowAttrs = []
  rows.forEach((row, rowIndex) => {
    let total = 0;
    argsCols.forEach(col => {
      total += +row[col];
    });
    if (rowAttrs[rowIndex] === undefined) {
      rowAttrs[rowIndex] = {};
    }
    rowAttrs[rowIndex].color = +row[totalCol] !== total && "#f99" || "#fff";
  });
  return rowAttrs;
};

function Paragraph({ children }: NodeViewComponentProps) {
  return <p onClick={() => console.log('click')}>{children}</p>;
}

const buildModelFromTerms = ({ terms }) => {
  const colsCount = Math.max(terms[0].length, terms[1].length);
  const rowsCount = Math.min(terms[0].length, terms[1].length);
  const cols = Array.apply(null, Array(colsCount + 1)).map((_, i) => String(i));
  const row = {};
  Array.apply(null, Array(colsCount + 1)).forEach((_, i) => {
    row[String(i)] = "";
  });
  const rows = Array.apply(null, Array(rowsCount + 1)).map(() => row);
  return {cols, rows};
}

function ModelEditor({ state }) {
  const reactNodeViews: Record<string, ReactNodeViewConstructor> = {
    paragraph: () => ({
      component: Paragraph,
      dom: document.createElement("div"),
      contentDOM: document.createElement("div"),
    }),
  };
  let { modelDoc, initializeGrid } = state.data;
  if (modelDoc === undefined) {
    const { terms } = state.data;
    let modelTable;
    if (initializeGrid) {
      modelTable = buildModelFromTerms({terms});
    } else {
      modelTable = modelTable || {
        cols: ["a", "b"],
        rows: [
          {a: "", b: ""},
          {a: "", b: ""},
        ],
      };
    }
    modelDoc = buildGridDocFromTable(modelTable);
  }
  return (
    <GridEditor
      state={state}
      doc={modelDoc}
      reactNodeViews={reactNodeViews}
    />
  );
}

const buildSumsFromTerms = ({ terms }) => {
  const rowsCount = Math.min(terms[0].length, terms[1].length);
  const cols = ["x"];
  const row = {"x": ""};
  const rows = Array.apply(null, Array(rowsCount + 1)).map(() => row);
  return {cols, rows};
};

function SumEditor({ state }) {
  console.log("ModelEditor() state=" + JSON.stringify(state, null, 2));
  const reactNodeViews: Record<string, ReactNodeViewConstructor> = {
    paragraph: () => ({
      component: Paragraph,
      dom: document.createElement("div"),
      contentDOM: document.createElement("div"),
    }),
  };
  let { sumDoc, initializeGrid } = state.data;
  if (sumDoc === undefined) {
    const { terms } = state.data;
    let sumTable;
    if (initializeGrid) {
      sumTable = buildSumsFromTerms({terms});
    } else {
      sumTable = sumTable || {
        cols: ["a"],
        rows: [
          {a: ""},
          {a: ""},
        ],
      };
    }
    sumDoc = buildColumnDocFromTable(sumTable);
  }
  return (
    <ColumnEditor
      state={state}
      doc={sumDoc}
      reactNodeViews={reactNodeViews}
    />
  );
}

export function Form({ state }) {
  const { expression } = state.data;
  const html = katex.renderToString(expression, {
    displayMode: true,
    output: "html",
    throwOnError: false
  });
  console.log("Form() html=" + html);
  return (
    (state === undefined || state.data === undefined) &&
    <div /> ||
    <>
      <div className="py-4">
        { state.data.problemStatement }
        <div className="p-4 text-4xl font-semibold text-slate-600">
          { parse(html) }
        </div>
      </div>
      <div className="grid gap-10 grid-cols-1 sm:grid-cols-2">
        <ModelEditor state={state} />
        <SumEditor state={state} />
      </div>
    </>
  );
}
