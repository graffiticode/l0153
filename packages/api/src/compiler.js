/* Copyright (c) 2023, ARTCOMPILER INC */
import {
  Checker as BasisChecker,
  Transformer as BasisTransformer,
  Compiler as BasisCompiler
} from '@graffiticode/basis';

export class Checker extends BasisChecker {
  TABLE(node, options, resume) {
    this.visit(node.elts[1], options, async (e1, v1) => {
      this.visit(node.elts[0], options, async (e0, v0) => {
        const err = [];
        const val = node;
        resume(err, val);
      });
    });
  }
}

const buildCell = ({ col, row }) => {
  const cell = row[col];
  console.log("buildCell() cell=" + JSON.stringify(cell, null, 2));
  let content;
  let colspan = 1;
  let rowspan = 1;
  if (typeof cell === "object") {
    content = cell.doc.content;
    console.log("buildCell() content=" + JSON.stringify(content, null, 2));
    colspan = content[0].content[0].content.length;
    rowspan = content[0].content[0].length;
    console.log("buildCell() colspan=" + colspan + " rowspan=" + rowspan + " content=" + JSON.stringify(content, null, 2));
  } else {
    content = [
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": row[col],
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
    },
    "content": content,
  });
};

const buildRow = ({ cols, row }) => {
  console.log("buildTable() cols=" + JSON.stringify(cols));
  console.log("buildTable() row=" + JSON.stringify(row));
  return ({
    "type": "table_row",
    "content": cols.map(col => {
      return buildCell({col, row});
    }),
  })
};

const buildTable = ({ cols, rows }) => {
  console.log("buildTable() cols=" + JSON.stringify(cols));
  console.log("buildTable() rows=" + JSON.stringify(rows));
  return ({
    "type": "table",
    "content": rows.map(row => {
      return buildRow({cols, row});
    })
  })
};

const buildDocFromTable = ({ cols, rows }) => {
  return {
    "type": "doc",
    "content": [
      buildTable({cols, rows}),
    ]
  }
};

export class Transformer extends BasisTransformer {
  TABLE(node, options, resume) {
    this.visit(node.elts[1], options, async (e1, v1) => {
      this.visit(node.elts[0], options, async (e0, v0) => {
        const doc = buildDocFromTable({...v0, ...v1});
        const err = [];
        const val = {doc};
        resume(err, val);
      });
    });
  }
  
  COLS(node, options, resume) {
    this.visit(node.elts[0], options, async (e0, v0) => {
      const data = options?.data || {};
      const err = [];
      const val = {
        cols: v0,
      };
      resume(err, val);
    });
  }
  
  ROWS(node, options, resume) {
    this.visit(node.elts[0], options, async (e0, v0) => {
      const data = options?.data || {};
      const err = [];
      const val = {
        rows: v0,
      };
      resume(err, val);
    });
  }

  PROG(node, options, resume) {
    this.visit(node.elts[0], options, async (e0, v0) => {
      const data = options?.data || {};
      const err = e0;
      const val = v0.pop();
      resume(err, {
        ...val,
        ...data,
      });
    });
  }
}

export const compiler = new BasisCompiler({
  langID: '0002',
  version: 'v0.0.1',
  Checker: Checker,
  Transformer: Transformer,
});
