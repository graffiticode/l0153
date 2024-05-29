import { keymap } from "prosemirror-keymap";
import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import type { Transaction } from "prosemirror-state";
import { useCallback, useState, useEffect } from "react";
import { debounce } from "lodash";

import { ProseMirror, useNodeViews } from "@nytimes/react-prosemirror";
//import type { NodeViewComponentProps } from "@nytimes/react-prosemirror";
//import type { ReactNodeViewConstructor } from "@nytimes/react-prosemirror";
import { react } from "@nytimes/react-prosemirror";

import "./MagicSquare.css";

import 'prosemirror-view/style/prosemirror.css';
import 'prosemirror-menu/style/menu.css';
import 'prosemirror-example-setup/style/style.css';
import 'prosemirror-gapcursor/style/gapcursor.css';

import { Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";


import { schema as baseSchema } from 'prosemirror-schema-basic';

import {
  goToNextCell,
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

const debouncedApply = debounce(({ state, type, args }) => {
  state.apply && state.apply({type, args});
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

const modelBackgroundPlugin = ({ terms, showFeedback }) => new Plugin({
  state: {
    init(_, { doc }) {
      return applyModelRules({doc, terms, showFeedback });
    },
    apply(tr, decorationSet, oldState, newState) {
      oldState = oldState;
      newState = newState;
      if (tr.docChanged) {
        return applyModelRules({doc: tr.doc, terms, showFeedback});
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

function rotateGrid({ grid, turns }) {
  turns = turns % 4;  // Normalize the number of turns
  while (turns > 0) {
    grid = grid[0].map((_, colIndex) => grid.map(row => row[colIndex]).reverse());
    turns--;
  }
  return grid;
}

function reflectGrid({ grid, turns }) {
  return turns % 2 === 0 && grid || grid.map(row => [...row].reverse());
}

const matchTerms = ({ cells, terms }) => {
  const flattenedCells = cells.flat().map(cell => cell.val);
  const flattenedTerms = terms.flat();
  return flattenedTerms.filter((val, index) => val === flattenedCells[index]);
};

const matchTermsToCells = ({ cells, terms }) => {
  cells = cells;
  // Rotate and reflect terms to match cells.
  const termsMatches = [];
  const reflectedRotatedTermsList = [];
  [0, 1].forEach((_, reflectTurns) => {
    const reflectedGrid = reflectGrid({ grid: terms, turns: reflectTurns });
    [0, 1, 2, 3].forEach((_, rotateTurns) => {
      const reflectedRotatedTerms = rotateGrid({grid: reflectedGrid, turns: rotateTurns});
      reflectedRotatedTermsList.push(reflectedRotatedTerms);
      termsMatches.push(matchTerms({cells, terms: reflectedRotatedTerms}));
    });
  });
  const termsMatchedIndex = termsMatches.reduce(
    (matchedIndex, terms, index) => terms.length > termsMatches[matchedIndex].length ?
      index :
      matchedIndex,
    0
  );
  const termsMatched = reflectedRotatedTermsList[termsMatchedIndex];
  return termsMatched;
};

const getGridCellColor = ({ val, term }) => {
  return val === term && "#efe" || "#fee";
};

const applyModelRules = ({ doc, terms, showFeedback }) => {
  const cells = getCells(doc);
  let cellColors = [];
  const shapedTerms = matchTermsToCells({ cells, terms });
  cells.forEach(({ row, col, val }) => {
    if (cellColors[row] === undefined) {
      cellColors[row] = [];
    }
    const term = shapedTerms[row - 1][col - 1];
    const color = getGridCellColor({val, term});
    cellColors[row][col] = color;
  });
  const coloredCells = cells.map(cell => ({
    ...cell,
    border:
      "border: 1px solid #aaa;",
    color:
      showFeedback && (
        isNaN(cell.val) && "#fff" ||
        cellColors[cell.row] && cellColors[cell.row][cell.col] ||
          "#efe"
      ) ||
      "#fff"
  }));
  return applyDecoration({doc, cells: coloredCells});
}

export default function GridEditor({ state, reactNodeViews }) {
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

  let gridDoc = modelEditorState.doc.toJSON();
  useEffect(() => {
    debouncedApply({
      state,
      type: "change",
      args: {
        gridDoc,
      },
    });
  }, [JSON.stringify(gridDoc)]);

  return (
      <div className="">
        <div className="text-lg py-4">
          Complete the Magic Square.
        </div>
        <ProseMirror
          mount={modelMount}
          state={modelEditorState}
          nodeViews={nodeViews}
          dispatchTransaction={dispatchTransaction}
        >
          <div ref={setModelMount} className={`w-fit`} />
          {renderNodeViews()}
        </ProseMirror>
      </div>
  );
}
