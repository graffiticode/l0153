// import {
//   baseKeymap,
//   chainCommands,
//   createParagraphNear,
//   liftEmptyBlock,
//   newlineInCode,
//   splitBlock,
//   toggleMark,
// } from "prosemirror-commands";
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
          default: null,
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

// const contentElement = document.querySelector('#content');
// if (!contentElement) {
//   throw new Error('Failed to find #content');
// }
// const doc = DOMParser.fromSchema(schema).parse(contentElement);

// let defaultEditorState = EditorState.create({
//   schema,
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
//   ),
// });

function Paragraph({ children }: NodeViewComponentProps) {
  return <p>{children}</p>;
}

// function List({ children }: NodeViewComponentProps) {
//   return <ul>{children}</ul>;
// }

// function ListItem({ children }: NodeViewComponentProps) {
//   return <li>{children}</li>;
// }

const debouncedApply = debounce(({ state, type, args }) => {
  state.apply({type, args});
}, 1000, {leading: true, trailing: true});

// const reactNodeViews: Record<string, ReactNodeViewConstructor> = {
//   paragraph: () => ({
//     component: Paragraph,
//     dom: document.createElement("div"),
//     contentDOM: document.createElement("span"),
//   }),
//   list: () => ({
//     component: List,
//     dom: document.createElement("div"),
//     contentDOM: document.createElement("div"),
//   }),
//   list_item: () => ({
//     component: ListItem,
//     dom: document.createElement("div"),
//     contentDOM: document.createElement("div"),
//   }),
// };

// const fix = fixTables(defaultEditorState);
// if (fix) defaultEditorState = defaultEditorState.apply(fix.setMeta('addToHistory', false));

// const buildTable = ({ data }) => {
//   return function Table() {
//     const { cols = [], rows = [] } = data;
//     console.log("buildTable() cols=" + cols);
//     useEditorEventListener("keydown", view => {
//       let tr = view.state.tr
//       view.dispatch(tr);
//     });
//     return (
//       <div className="pt-10">
//         <div className="mt-8 flow-root">
//           <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
//             <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
//               <table className="min-w-full divide-y divide-gray-300">
//                 <thead>
//                   <tr>
//                     {
//                       cols.map((col, index) => (
//                         <th key={index} scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-gray-900 sm:pl-0">
//                           {col}
//                         </th>
//                       ))
//                     }
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200">
//                   {
//                     rows.map((row, index) => (
//                       <tr key={index}>
//                         {
//                           cols.map((col, index) => (
//                             <td key={index} className="whitespace-nowrap py-2 pl-4 pr-3 text-xs font-medium text-gray-900 sm:pl-0">
//                               {row[col]}
//                             </td>
//                           ))
//                         }
//                       </tr>
//                     ))
//                   }
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>
//       </div>
//     )
//   }
// };

const { table, table_row, table_cell, paragraph } = schema.nodes;
const cellAttrs = {width: "50px", height: "50px"};
const docNode = schema.node("doc", null, [
  table.create(null, [
    table_row.create(null, [
      table_cell.create(cellAttrs, [paragraph.create(null, [schema.text("1")])]),
      table_cell.create(cellAttrs, [paragraph.create(null, [schema.text("2")])])
    ]),
    table_row.create(null, [
      table_cell.create(cellAttrs, [paragraph.create(null, [schema.text("3")])]),
      table_cell.create(cellAttrs, [paragraph.create(null, [schema.text("4")])])
    ])
  ])
]);

function Editor({ state, reactNodeViews }) {
  const { nodeViews, renderNodeViews } = useNodeViews(reactNodeViews);
  const [ mount, setMount ] = useState<HTMLDivElement | null>(null);
//  const [ doc, setDoc ] = useState({});
  const [ editorState, setEditorState ] = useState(EditorState.create({
    doc: docNode,
    plugins: [
      columnResizing(),
      tableEditing(),
      keymap({
        Tab: goToNextCell(1),
        'Shift-Tab': goToNextCell(-1),
      }),
      react(),    
    ].concat(
      exampleSetup({
        schema,
        menuContent: menu as MenuItem[][],
      }),
    ),
  }));
  
  const dispatchTransaction = useCallback(
    (tr: Transaction) => (
      console.log("click"),
      setEditorState((oldState) => oldState.apply(tr))
    ),
    []
  );

  const docJSON = editorState.doc.toJSON();
  useEffect(() => {
    debouncedApply({
      state,
      type: "change",
      args: {
        docJSON,
      },
    });
  }, [JSON.stringify(docJSON)]);

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
  //const { data } = state;
  const reactNodeViews: Record<string, ReactNodeViewConstructor> = {
    paragraph: () => ({
      component: Paragraph, //buildTable({ data }),
      dom: document.createElement("div"),
      contentDOM: document.createElement("div"),
    }),
  };
  return (
    <Editor state={state} reactNodeViews={reactNodeViews} />
  );
}
