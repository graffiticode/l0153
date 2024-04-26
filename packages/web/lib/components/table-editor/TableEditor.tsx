// import {
//   baseKeymap,
//   chainCommands,
//   createParagraphNear,
//   liftEmptyBlock,
//   newlineInCode,
//   splitBlock,
//   toggleMark,
// } from "prosemirror-commands";
// import assert from "assert";
import { keymap } from "prosemirror-keymap";
import { Schema } from "prosemirror-model";
//import { liftListItem, splitListItem } from "prosemirror-schema-list";
import { EditorState } from "prosemirror-state";
import type { Transaction } from "prosemirror-state";
import "prosemirror-view/style/prosemirror.css";
import { useCallback, useState, useEffect } from "react";
import { debounce } from "lodash";

import { ProseMirror, useNodeViews /*, useEditorEventListener*/ } from "@nytimes/react-prosemirror";
import type { NodeViewComponentProps } from "@nytimes/react-prosemirror";
import type { ReactNodeViewConstructor } from "@nytimes/react-prosemirror";
import { react } from "@nytimes/react-prosemirror";

//import Menu from "./Menu.js";
import "./TableEditor.css";

import 'prosemirror-view/style/prosemirror.css';
import 'prosemirror-menu/style/menu.css';
import 'prosemirror-example-setup/style/style.css';
import 'prosemirror-gapcursor/style/gapcursor.css';
//import '../style/tables.css';

//import { EditorView } from 'prosemirror-view';
//import { EditorState } from 'prosemirror-state';
//import { DOMParser, Schema } from 'prosemirror-model';
import { schema as baseSchema } from 'prosemirror-schema-basic';
//import { keymap } from 'prosemirror-keymap';
import { exampleSetup, buildMenuItems } from 'prosemirror-example-setup';
import { MenuItem, Dropdown } from 'prosemirror-menu';

import {
  addColumnAfter,
  addColumnBefore,
  deleteColumn,
  addRowAfter,
  addRowBefore,
  deleteRow,
  mergeCells,
  splitCell,
  setCellAttr,
  toggleHeaderRow,
  toggleHeaderColumn,
  toggleHeaderCell,
  goToNextCell,
  deleteTable,
} from 'prosemirror-tables';
import { tableEditing, columnResizing, tableNodes /*, fixTables*/ } from 'prosemirror-tables';

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
      },
    }),
  ),
  marks: baseSchema.spec.marks,
});

const menu = buildMenuItems(schema).fullMenu;
function item(label: string, cmd: (state: EditorState) => boolean) {
  return new MenuItem({ label, select: cmd, run: cmd });
}
const tableMenu = [
  item('Insert column before', addColumnBefore),
  item('Insert column after', addColumnAfter),
  item('Delete column', deleteColumn),
  item('Insert row before', addRowBefore),
  item('Insert row after', addRowAfter),
  item('Delete row', deleteRow),
  item('Delete table', deleteTable),
  item('Merge cells', mergeCells),
  item('Split cell', splitCell),
  item('Toggle header column', toggleHeaderColumn),
  item('Toggle header row', toggleHeaderRow),
  item('Toggle header cells', toggleHeaderCell),
  item('Make cell green', setCellAttr('background', '#dfd')),
  item('Make cell not-green', setCellAttr('background', null)),
];
menu.splice(2, 0, [new Dropdown(tableMenu, { label: 'Table' })]);

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
            paragraph.create(null, [schema.text(" ")])
          ]),
        ]),
      ])
    ])
  );
};

import { Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

// Plugin to dynamically change background color based on content length
const applyDecoration = ({ doc, cells }) => {
  const decorations = [];
  // const grid = [];
  // let row = 0, col = 0;
  // doc.descendants((node, pos) => {
  //   if (node.type.name === "table_row") {
  //     row++;
  //     col = 0;
  //   }
  //   if (node.type.name === "table_cell") {
  //     col++;
  //   }
  //   if (node.type.name === "paragraph") {
  //     const color = node.textContent.length > 2 ? "lightblue" : "white";
  //     decorations.push(Decoration.node(pos, pos + node.nodeSize, { style: `background-color: ${color};` }));
  //   }
  // });
  cells.forEach({ from, to, color } => {
    decorations.push(Decoration.node(from, to, { style: `background-color: ${color};` }));
  });
  return DecorationSet.create(doc, decorations);
};

const dynamicBackgroundPlugin = new Plugin({
  state: {
    init(_, { doc }) {
      console.log("plugin init()");
      return applyRules({doc});
    },
    apply(tr, decorationSet, oldState, newState) {
      oldState = oldState;
      newState = newState;
      console.log("plugin apply()");
      if (tr.docChanged) {
        return applyRules({doc: tr.doc});
      }
      return decorationSet;
    },
  },
  props: {
    decorations(state) {
      console.log("plugin props decorations()");
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
    }
    if (node.type.name === "paragraph") {
      const val = +node.textContent;
      cells.push({row, col, val, from: pos, to: pos + node.nodeSize});
    }
  });
  return cells;
};

const applyRules = ({ doc }) => {
  const cells = getCells(doc);
  const rowCount = +cells[cells.length - 1].row;
  const colCount = +cells[cells.length - 1].col;
  let rowSums = [];
  let colSums = [];
  let rowTotals = [];
  let colTotals = [];
  let rowColors = [];
  let colColors = [];
  cells.forEach(({ row, col, val }) => {
    console.log("applyRules() row=" + JSON.stringify(row) + " col=" + col + " val=" + val);
    if (row < rowCount) {
      if (colSums[col] === undefined) {
        colSums[col] = val;
      } else {
        colSums[col] += val;
      }
    } else {
      colTotals[col] = val;
      colColors[col] = val !== colSums[col] && "red" || null;
    }
    if (col < colCount) {
      if (rowSums[row] === undefined) {
        rowSums[row] = val;
      } else {
        rowSums[row] += val;
      }
    } else {
      rowTotals[row] = val;
      rowColors[row] = val !== rowSums[row] && "red" || null;
    }
  });
  const coloredCells = cells.map(cell => ({
    ...cell,
    color: rowColors[cell.row] || colColors[cell.col] || "white",
  }));
  console.log("applyRules() coloredCells=" + JSON.stringify(coloredCells, null, 2));
  return applyDecoration({doc, cells: coloredCells});
}

//   // Make a copy of doc so we can mutate it.
//   doc = JSON.parse(JSON.stringify(doc));
//   doc.content.forEach(table => {
//     assert(table.type === "table");
//     table.content.forEach(row => {
//       assert(row.type === "table_row");
//       const cellCount = row.content.length;
//       let total = 0;
//       let sum = 0;
//       row.content.forEach((cell, cellIndex) => {
//         assert(cell.type === "table_cell");
//         const val = cell.content[0].content && +cell.content[0].content[0]?.text || Number.NaN;
//         if (cellIndex < cellCount - 1) {
//           sum += val;
//         } else {
//           total = val;
//         }
//       });
//       const color = sum !== total && "#f99" || "#fff";
//       row.content.forEach(cell => {
//         cell.attrs.background = color;
//       });
//     });
//   });
  
// //  console.log("applyRules() doc=" + JSON.stringify(doc, null, 2));
//   return doc;
//   // const argsCols = cols.slice(0, cols.length - 1);
//   // const totalCol = cols[cols.length - 1];
//   // const rowAttrs = []
//   // rows.forEach((row, rowIndex) => {
//   //   let total = 0;
//   //   argsCols.forEach(col => {
//   //     total += +row[col];
//   //   });
//   //   if (rowAttrs[rowIndex] === undefined) {
//   //     rowAttrs[rowIndex] = {};
//   //   }
//   //   rowAttrs[rowIndex].color = +row[totalCol] !== total && "#f99" || "#fff";
//   // });
//   // console.log("applyRules() rowAttrs=" + JSON.stringify(rowAttrs, null, 2));
// };

function Editor({ state, reactNodeViews }) {
  const { nodeViews, renderNodeViews } = useNodeViews(reactNodeViews);
  const [ mount, setMount ] = useState<HTMLDivElement | null>(null);
  const [ editorState, setEditorState ] = useState(EditorState.create({
      doc: createDocNode(state.data.doc),
      plugins: [
        columnResizing(),
        tableEditing(),
        keymap({
          Tab: goToNextCell(1),
          'Shift-Tab': goToNextCell(-1),
        }),
        react(),
        dynamicBackgroundPlugin,
      ].concat(
        exampleSetup({
          schema,
          menuContent: menu as MenuItem[][],
        }),
      )
  }));
  
  const dispatchTransaction = useCallback(
    (tr: Transaction) => (
      console.log("tr=" + JSON.stringify(tr, null, 2)),
      setEditorState((oldState) => oldState.apply(tr))
    ),
    []
  );

  let doc = editorState.doc.toJSON();
  useEffect(() => {
    // const { rules } = state.data;
    // setEditorState(EditorState.create({
    //   doc: applyRules({doc, rules}),
    //   plugins: [
    //     columnResizing(),
    //     tableEditing(),
    //     keymap({
    //       Tab: goToNextCell(1),
    //       'Shift-Tab': goToNextCell(-1),
    //     }),
    //     react(),
    //   ].concat(
    //     exampleSetup({
    //       schema,
    //       menuContent: menu as MenuItem[][],
    //     }),
    //   )
    // }));
    debouncedApply({
      state,
      type: "change",
      args: {
        doc,
      },
    });
  }, [JSON.stringify(doc)]);

  return (
    <ProseMirror
      mount={mount}
      state={editorState}
      nodeViews={nodeViews}
      dispatchTransaction={dispatchTransaction}
    >
      <div ref={setMount} />
      {renderNodeViews()}
    </ProseMirror>
  );
}

export function TableEditor({ state }) {
  const reactNodeViews: Record<string, ReactNodeViewConstructor> = {
    paragraph: () => ({
      component: Paragraph,
      dom: document.createElement("div"),
      contentDOM: document.createElement("div"),
    }),
  };
  return (
    <Editor state={state} reactNodeViews={reactNodeViews} />
  );
}
