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

const buildCell = ({ col, row, attrs }) => {
  const cell = row[col];
  console.log("buildCell() cell=" + JSON.stringify(cell, null, 2));
  let content;
  let colspan = 1;
  let rowspan = 1;
  let background = "#fff";
  if (typeof cell === "object") {
    content = cell.doc.content;
    console.log("buildCell() content=" + JSON.stringify(content, null, 2));
    colspan = content[0].content[0].content.length;
    rowspan = content[0].content[0].length;
    console.log("buildCell() colspan=" + colspan + " rowspan=" + rowspan + " content=" + JSON.stringify(content, null, 2));
  } else {
    background = attrs.color;
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
      background,
    },
    "content": content,
  });
};

const buildRow = ({ cols, row, attrs }) => {
  console.log("buildTable() cols=" + JSON.stringify(cols));
  console.log("buildTable() row=" + JSON.stringify(row));
  return ({
    "type": "table_row",
    "content": cols.map(col => {
      return buildCell({col, row, attrs});
    }),
  })
};

const buildTable = ({ cols, rows, attrs }) => {
  console.log("buildTable() cols=" + JSON.stringify(cols));
  console.log("buildTable() rows=" + JSON.stringify(rows));
  return ({
    "type": "table",
    "content": rows.map((row, rowIndex) => {
      return buildRow({cols, row, attrs: attrs[rowIndex]});
    })
  })
};

const buildDocFromTable = ({ cols, rows, rules }) => {
  const attrs = applyRules({ cols, rows, rules });
  return {
    "type": "doc",
    "content": [
      buildTable({cols, rows, attrs}),
    ]
  }
};

const applyRules = ({ cols, rows, rules }) => {
  rules = rules;
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
  console.log("applyRules() rowAttrs=" + JSON.stringify(rowAttrs, null, 2));
  return rowAttrs;
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
      console.log("PROG() val=" + JSON.stringify(val, null, 2));
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
