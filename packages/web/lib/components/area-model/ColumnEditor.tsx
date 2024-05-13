import { keymap } from "prosemirror-keymap";
import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import type { Transaction } from "prosemirror-state";
import { useCallback, useState, useEffect } from "react";
import { debounce } from "lodash";

import { ProseMirror, useNodeViews /*, useEditorEventListener*/ } from "@nytimes/react-prosemirror";
// import type { NodeViewComponentProps } from "@nytimes/react-prosemirror";
// import type { ReactNodeViewConstructor } from "@nytimes/react-prosemirror";
import { react } from "@nytimes/react-prosemirror";

// import GridEditor from "./GridEditor.js";
import ColumnMenu from "./ColumnMenu.js";
import "./AreaModel.css";

import 'prosemirror-view/style/prosemirror.css';
import 'prosemirror-menu/style/menu.css';
import 'prosemirror-example-setup/style/style.css';
import 'prosemirror-gapcursor/style/gapcursor.css';

import { schema as baseSchema } from 'prosemirror-schema-basic';

import {
  goToNextCell,
} from 'prosemirror-tables';
import { tableEditing, columnResizing, tableNodes /*, fixTables*/ } from 'prosemirror-tables';

// import parse from 'html-react-parser';

const schema = new Schema({
  nodes: baseSchema.spec.nodes.append(
    tableNodes({
      tableGroup: 'block',
      cellContent: 'block+',
      cellAttributes: {
        width: {
          default: "50px",
          getFromDOM(dom) {
            return dom.style.width || null;
          },
          setDOMAttr(value, attrs) {
            if (value !== null) attrs.style = (attrs.style || "") + `width: ${value};`;
          }
        },
        height: {
          default: "50px",
          getFromDOM(dom) {
            return dom.style.height || null;
          },
          setDOMAttr(value, attrs) {
            if (value !== null) attrs.style = (attrs.style || "") + `height: ${value};`;
          }
        },
        background: {
          default: "#fff",
          getFromDOM(dom) {
            return dom.style.backgroundColor || null;
          },
          setDOMAttr(value, attrs) {
            if (value)
              attrs.style = (attrs.style || '') + `background-color: ${value};`;
          },
        },
        border: {
          default: "1px solid #aaa",
          getFromDOM(dom) {
            return dom.style.border || null;
          },
          setDOMAttr(value, attrs) {
            if (value)
              attrs.style = (attrs.style || '') + `${value};`;
          },
        },
      },
    }),
  ),
  marks: baseSchema.spec.marks,
});

// function Paragraph({ children }: NodeViewComponentProps) {
//   return <p onClick={() => console.log('click')}>{children}</p>;
// }

const debouncedApply = debounce(({ state, type, args }) => {
  state.apply({type, args});
}, 1000, {leading: true, trailing: true});

const { table, table_row, table_cell, paragraph } = schema.nodes;
const cellAttrs = {width: "50px", height: "50px", background: "#fff"};
const createDocNode = doc => {
  return (
    doc && schema.nodeFromJSON(doc) || schema.node("doc", null, [
      table.create(null, [
        table_row.create(null, [
          table_cell.create(cellAttrs, [
            paragraph.create(null, [schema.text(" ")]),
          ]),
        ]),
      ])
    ])
  );
};

import { Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

const applyDecoration = ({ doc, cells }) => {
  const decorations = [];
  cells.forEach(({ from, to, color, border }) => {
    decorations.push(Decoration.node(from, to, {
      style: `
        background-color: ${color};
        ${border};
      `
    }));
  });
  return DecorationSet.create(doc, decorations);
};

const columnBackgroundPlugin = ({ terms }) => new Plugin({
  state: {
    init(_, { doc }) {
      return applyColumnRules({doc, terms});
    },
    apply(tr, decorationSet, oldState, newState) {
      oldState = oldState;
      newState = newState;
      if (tr.docChanged) {
        return applyColumnRules({doc: tr.doc, terms});
      }
      return decorationSet;
    },
  },
  props: {
    decorations(state) {
      return this.getState(state);
    }
  }
});

const getColumnCells = (doc) => {
  const cells = [];
  let row = 0, col;
  doc.descendants((node, pos) => {
    if (node.type.name === "table_row") {
      row++;
      col = 0;
    }
    if (node.type.name === "table_cell") {
      col++;
      const val = Number.parseInt(node.textContent.replace(/,/g, ""));
      cells.push({row, col, val, from: pos, to: pos + node.nodeSize});
    }
  });
  return cells;
};

const matchTerms = ({ terms, cells }) => {
  const vals = cells.map(cell => cell.val);
  const flattenedTerms = [];
  const rowTots = [];
  const rowTermIndexes = [];
  terms[0].forEach(colVal => {
    let rowTot = 0;
    rowTermIndexes.push([]);
    terms[1].forEach(rowVal => {
      const cellVal = rowVal * colVal;
      flattenedTerms.push(cellVal);
      rowTermIndexes[rowTermIndexes.length - 1].push(flattenedTerms.length - 1);
      rowTot += cellVal;
    });
    rowTots.push(rowTot);
  });
  const unusedTerms = flattenedTerms.slice(0);
  const shapedTerms = vals.map(val => {
    const index = val !== null && unusedTerms.indexOf(val);
    if (index >= 0) {
      unusedTerms[index] = undefined;
      return val;
    }
    const rowIndex = val !== null && rowTots.indexOf(val);
    if (rowIndex >= 0) {
      rowTermIndexes[rowIndex].forEach(index => {
        unusedTerms[index] = undefined;
      });
      return val;
    }
    return null;
  });
  return shapedTerms;
};

const shapeColumnTermsByValue = ({ terms, cells }) => {
  // const rowVals = [];
  // const flattenedTerms = [];
  // terms[0].forEach(colVal => {
  //   rowVals.push([0]);
  //   terms[1].forEach(rowVal => {
  //     const cellVal = rowVal * colVal;
  //     flattenedTerms.push(cellVal);
  //     rowVals.peek().push(cellVal);
  //   });
  // });
  // const vals = cells.map(cell => cell.val);
  // const unusedTerms = flattenedTerms.slice(0);
  // const shapedTerms = vals.map(val => {
  //   const index = val !== null && unusedTerms.indexOf(val);
  //   if (index >= 0) {
  //     unusedTerms[index] = undefined;
  //     return val;
  //   }
  //   return null;
  // });
  // terms[0].forEach(colVal => {
  //   let rowVal = 0;
  //   terms[1].forEach(rowVal => {
  //     const cellVal = rowVal * colVal;
  //     flattenedTerms.push(cellVal);
  //     rowVal += cellVal;
  //   });
  //   rowVals.push(rowVal);
  // });
  const flattenedTerms = [];
  const shapedTerms = matchTerms({terms, cells});
  const sum = flattenedTerms.reduce((acc, val) => acc + val, 0);
  shapedTerms[shapedTerms.length - 1] = sum;
  return shapedTerms;
};

const getColumnCellColor = ({ row, col, val, terms }) => {
  return (
    col === 1 && row === terms.length && terms[row - 1] !== val && "#fdd" ||
    col === 1 && terms[row - 1] !== val && "#fee" ||
    null
  );
};

const applyColumnRules = ({ doc, terms }) => {
  // Multiply first row and first column values and compare to body values.
  const cells = getColumnCells(doc);
  const shapedTerms = shapeColumnTermsByValue({ terms, cells });
  let cellColors = [];
  cells.forEach(({ row, col, val }) => {
    const color = getColumnCellColor({row, col, val, terms: shapedTerms});
    if (cellColors[row - 1] === undefined) {
      cellColors[row - 1] = [];
    }
    cellColors[row - 1][col - 1] = color;
  });
  const coloredCells = cells.map(cell => ({
    ...cell,
    border:
    cell.col === 1 && cell.row === shapedTerms.length && "border: 1px solid #aaa; border-top: 1.5px solid #333;" ||
      "border: 1px solid #aaa",
    color:
      isNaN(cell.val) && ((cell.col === 1 && cell.row === shapedTerms.length) && "#eee" || "#fff") ||
      cellColors[cell.row - 1] && cellColors[cell.row - 1][cell.col - 1] ||
      cell.col === 1 && cell.row === shapedTerms.length && "#dfd" ||
      "#efe"
  }));
  return applyDecoration({doc, cells: coloredCells});
}

export default function ColumnEditor({ state, reactNodeViews }) {
  const { nodeViews, renderNodeViews } = useNodeViews(reactNodeViews);
  const [ sumMount, setSumMount ] = useState<HTMLDivElement | null>(null);
  const [ sumEditorState, setSumEditorState ] = useState(EditorState.create({
    doc: createDocNode(state.data.columnDoc),
    schema,
      plugins: [
        columnResizing(),
        tableEditing(),
        keymap({
          Tab: goToNextCell(1),
          'Shift-Tab': goToNextCell(-1),
        }),
        react(),
        columnBackgroundPlugin(state.data),
      ]
  }));

  const dispatchTransaction = useCallback(
    (tr: Transaction) => (
      setSumEditorState((oldState) => oldState.apply(tr))
    ),
    []
  );

  let doc = sumEditorState.doc.toJSON();
  useEffect(() => {
    debouncedApply({
      state,
      type: "change",
      args: {
        doc,
      },
    });
  }, [JSON.stringify(doc)]);

  return (
    <>
      <div className="">
        <div className="text-lg py-4">
          Sum the parts to evaluate the expression.
        </div>
        <ProseMirror
          mount={sumMount}
          state={sumEditorState}
          nodeViews={nodeViews}
          dispatchTransaction={dispatchTransaction}
        >
          <ColumnMenu showGridButtons={!state.data.initializeGrid} />
          <div ref={setSumMount} className={`w-fit`} />
          {renderNodeViews()}
        </ProseMirror>
      </div>
    </>
  );
}
