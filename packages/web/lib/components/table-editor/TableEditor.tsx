import { keymap } from "prosemirror-keymap";
import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import type { Transaction } from "prosemirror-state";
import { useCallback, useState, useEffect } from "react";
import { debounce } from "lodash";

import { ProseMirror, useNodeViews /*, useEditorEventListener*/ } from "@nytimes/react-prosemirror";
import type { NodeViewComponentProps } from "@nytimes/react-prosemirror";
import type { ReactNodeViewConstructor } from "@nytimes/react-prosemirror";
import { react } from "@nytimes/react-prosemirror";

import GridMenu from "./GridMenu.js";
import SumMenu from "./SumMenu.js";
import "./TableEditor.css";

import 'prosemirror-view/style/prosemirror.css';
import 'prosemirror-menu/style/menu.css';
import 'prosemirror-example-setup/style/style.css';
import 'prosemirror-gapcursor/style/gapcursor.css';

import { schema as baseSchema } from 'prosemirror-schema-basic';

import {
  goToNextCell,
} from 'prosemirror-tables';
import { tableEditing, columnResizing, tableNodes /*, fixTables*/ } from 'prosemirror-tables';

import parse from 'html-react-parser';

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

function Paragraph({ children }: NodeViewComponentProps) {
  return <p onClick={() => console.log('click')}>{children}</p>;
}

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

const modelBackgroundPlugin = ({ terms }) => new Plugin({
  state: {
    init(_, { doc }) {
      return applyModelRules({doc, terms});
    },
    apply(tr, decorationSet, oldState, newState) {
      oldState = oldState;
      newState = newState;
      if (tr.docChanged) {
        return applyModelRules({doc: tr.doc, terms});
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

const getCells = (doc) => {
  const cells = [];
  let row = 0, col = 0;
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

// const applyGridAddRules = ({ doc }) => {
//   const cells = getCells(doc);
//   const rowCount = +cells[cells.length - 1].row;
//   const colCount = +cells[cells.length - 1].col;
//   let rowSums = [];
//   let colSums = [];
//   let rowTotals = [];
//   let colTotals = [];
//   let rowColors = [];
//   let colColors = [];
//   cells.forEach(({ row, col, val }) => {
//     if (row < rowCount) {
//       if (colSums[col] === undefined) {
//         colSums[col] = val;
//       } else {
//         colSums[col] += val;
//       }
//     } else {
//       colTotals[col] = val;
//       colColors[col] = val !== colSums[col] && "#fee" || null;
//     }
//     if (col < colCount) {
//       if (rowSums[row] === undefined) {
//         rowSums[row] = val;
//       } else {
//         rowSums[row] += val;
//       }
//     } else {
//       rowTotals[row] = val;
//       rowColors[row] = val !== rowSums[row] && "#fee" || null;
//     }
//   });
//   const coloredCells = cells.map(cell => ({
//     ...cell,
//     color:
//       isNaN(cell.val) && "#fff" ||
//       rowColors[cell.row] ||
//       colColors[cell.col] ||
//       "#efe",
//   }));
//   return applyDecoration({doc, cells: coloredCells});
// }

const placeValue = val => {
  let divisor = 10;
  while (val >= divisor) {
    divisor *= 10;
  }
  return String(divisor).length - 1;
}

const shapeTermsByValue = ({ cells, terms }) => {
  const { row: rowCount, col: colCount } = cells[cells.length - 1];
  const dims = [terms[0].length + 1, terms[1].length + 1];
  terms = colCount === dims[0] && rowCount == dims[1] && terms || terms.reverse();
  // 1. order terms according to cells
  // 2. shape terms according to cells
  let rowAligned = 0;
  let rowUnaligned = 0;
  let colAligned = 0;
  let colUnaligned = 0;
  cells.forEach(({ row, col, val }) => {
    // Align ascending vs descending terms.
    if (val) {
      const pv = placeValue(val);
      rowAligned += row === 1 && placeValue(terms[0][col - 2]) === pv && 1 || 0;
      rowUnaligned += row === 1 && placeValue(terms[0][terms[0].length - (col - 1)]) === pv && 1 || 0;
      colAligned += col === 1 && placeValue(terms[1][row - 2]) === pv && 1 || 0;
      colUnaligned += col === 1 && placeValue(terms[1][terms[1].length - (row - 1)]) === pv && 1 || 0;
    }
  });
  if (rowUnaligned > rowAligned) {
    terms[0] = terms[0].reverse();
  }
  if (colUnaligned > colAligned) {
    terms[1] = terms[1].reverse();
  }

  // Now pivot grid if necessary.

  let aligned = 0;
  let unaligned = 0;
  cells.forEach(({ row, col, val }) => {
    if (val) {
      // Try to match the terms to the current values regardless or order to see
      // if we need to pivot or not.
      unaligned += row === 1 && terms[1][col - 2] === val && 1 || 0;
      unaligned += row === 1 && terms[1][terms[1].length - (col - 2) - 1] === val && 1 || 0;
      unaligned += col === 1 && terms[0][row - 2] === val && 1 || 0;
      unaligned += col === 1 && terms[0][terms[0].length - (row - 2) - 1] === val && 1 || 0;

      aligned   += row === 1 && terms[0][col - 2] === val && 1 || 0;
      aligned   += row === 1 && terms[0][terms[0].length - (col - 2) - 1] === val && 1 || 0;
      aligned   += col === 1 && terms[1][row - 2] === val && 1 || 0;
      aligned   += col === 1 && terms[1][terms[1].length - (row - 2) - 1] === val && 1 || 0;
    }
  });
  terms = unaligned > aligned && terms.reverse() || terms;
  return terms;
};

const shapeColumnTermsByValue = ({ terms, cells }) => {
  const flattenedTerms = [];
  terms[0].forEach(colVal => {
    terms[1].forEach(rowVal => {
      flattenedTerms.push(colVal * rowVal);
    })
  });
  const vals = cells.map(cell => cell.val);
  const unusedTerms = flattenedTerms.slice(0);
  const shapedTerms = vals.map(val => {
    const index = val !== null && unusedTerms.indexOf(val);
    if (index >= 0) {
      unusedTerms[index] = undefined;
      return val;
    }
    return null;
  });
  const sum = flattenedTerms.reduce((acc, val) => acc + val, 0);
  shapedTerms[shapedTerms.length - 1] = sum;
  return shapedTerms;
};

const getGridCellColor = ({ row, col, val, rowVals, colVals, terms }) => {
  return (row === 1 && col > 1 && terms[0][col - 2] !== val ||
          col === 1 && row > 1 && terms[1][row - 2] !== val) && "#fdd" ||
    row > 1 && col > 1 && val !== rowVals[row] * colVals[col] && "#fee" ||
    null;
};

const getColumnCellColor = ({ row, col, val, terms }) => {
  return (
    col === 1 && row === terms.length && terms[row - 1] !== val && "#fdd" ||
    col === 1 && terms[row - 1] !== val && "#fee" ||
    null
  );
};

const applyModelRules = ({ doc, terms }) => {
  // Multiply first row and first column values and compare to body values.
  const cells = getCells(doc);
  let rowVals = [];
  let colVals = [];
  let rowSums = [];
  let colSums = [];
  let cellColors = [];
  cells.forEach(({ row, col, val }) => {
    if (row === 1) {
      colVals[col] = val;
    } else {
      if (colSums[col] === undefined) {
        colSums[col] = val;
      } else {
        colSums[col] += val;
      }
    }
    if (cellColors[row] === undefined) {
      cellColors[row] = [];
    }
    if (col === 1) {
      rowVals[row] = val;
    } else {
      if (rowSums[row] === undefined) {
        rowSums[row] = val;
      } else {
        rowSums[row] += val;
      }
    }
    const shapedTerms = shapeTermsByValue({ cells, terms });
    const color = getGridCellColor({row, col, val, rowVals, colVals, terms: shapedTerms});
    cellColors[row][col] = color;
  });
  const coloredCells = cells.map(cell => ({
    ...cell,
    border:
    cell.col === 1 && cell.row === 1 && "border: 1px solid #aaa; border-right: 1.5px solid #333; border-bottom: 1.5px solid #333;" ||
      cell.col === 1 && "border: 1px solid #aaa; border-right: 1.5px solid #333;" ||
      cell.row === 1 && "border: 1px solid #aaa; border-bottom: 1.5px solid #333;" ||
      "border: 1px solid #aaa;",
    color:
      isNaN(cell.val) && ((cell.col === 1 || cell.row === 1) && "#eee" || "#fff") ||
      cellColors[cell.row] && cellColors[cell.row][cell.col] ||
      (cell.col === 1 || cell.row === 1) && "#dfd" || "#efe"
  }));
  return applyDecoration({doc, cells: coloredCells});
}

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

function GridEditor({ state, reactNodeViews }) {
  const { nodeViews, renderNodeViews } = useNodeViews(reactNodeViews);
  const [ modelMount, setModelMount ] = useState<HTMLDivElement | null>(null);
  const [ modelEditorState, setModelEditorState ] = useState(EditorState.create({
    doc: createDocNode(state.data.gridDoc),
    schema,
      plugins: [
        columnResizing(),
        tableEditing(),
        keymap({
          Tab: goToNextCell(1),
          'Shift-Tab': goToNextCell(-1),
        }),
        react(),
        modelBackgroundPlugin(state.data),
      ]
  }));

  const dispatchTransaction = useCallback(
    (tr: Transaction) => (
      setModelEditorState((oldState) => oldState.apply(tr))
    ),
    []
  );

  let doc = modelEditorState.doc.toJSON();
  useEffect(() => {
    debouncedApply({
      state,
      type: "change",
      args: {
        gridDoc: doc,
      },
    });
  }, [JSON.stringify(doc)]);

  return (
      <div className="">
        <div className="text-lg py-4">
          Create an area model to find the partial sums of the expression.
        </div>
        <ProseMirror
          mount={modelMount}
          state={modelEditorState}
          nodeViews={nodeViews}
          dispatchTransaction={dispatchTransaction}
        >
          <GridMenu showGridButtons={!state.data.initializeGrid} />
          <div ref={setModelMount} className={`w-fit`} />
          {renderNodeViews()}
        </ProseMirror>
      </div>
  );
}

function ColumnEditor({ state, reactNodeViews }) {
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
          <SumMenu showGridButtons={!state.data.initializeGrid} />
          <div ref={setSumMount} className={`w-fit`} />
          {renderNodeViews()}
        </ProseMirror>
      </div>
    </>
  );
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

export function TableEditor({ state }) {
  return (
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
