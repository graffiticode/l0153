/* Copyright (c) 2023, ARTCOMPILER INC */
import {
  Checker as BasisChecker,
  Transformer as BasisTransformer,
  Compiler as BasisCompiler
} from '@graffiticode/basis';

import { Parser } from '@artcompiler/parselatex';

import katex from 'katex';

export class Checker extends BasisChecker {
  AREA_MODEL(node, options, resume) {
    this.visit(node.elts[1], options, async (e1, v1) => {
      this.visit(node.elts[0], options, async (e0, v0) => {
        const err = [];
        const val = node;
        resume(err, val);
      });
    });
  }

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
    "content": cols.map((col, index) => {
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

const buildDocFromTable = ({ cols, rows, rules }) => {
  const attrs = applyRules({ cols, rows, rules });
  return {
    "type": "doc",
    "content": [
      {
        ...buildTable({cols, rows, attrs}),
      },
    ]
  }
};

const buildDocFromTerms = ({ terms, rules }) => {
  const colsCount = Math.max(terms[0].length, terms[1].length);
  const rowsCount = Math.min(terms[0].length, terms[1].length);
  const cols = Array.apply(null, Array(colsCount + 1)).map((x, i) => String(i));
  const row = {};
  Array.apply(null, Array(colsCount + 1)).forEach((x, i) => {
    row[String(i)] = "";
  });
  const rows = Array.apply(null, Array(rowsCount + 1)).map((x, i) => row);
  const attrs = applyRules({ cols, rows, rules });
  return {
    "type": "doc",
    "content": [
      {
        ...buildTable({cols, rows, attrs}),
      },
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
  return rowAttrs;
};

export class Transformer extends BasisTransformer {
  AREA_MODEL(node, options, resume) {
    this.visit(node.elts[1], options, async (e1, v1) => {
      this.visit(node.elts[0], options, async (e0, v0) => {
        let doc;
        if (v0.initializeGrid || v1.initializeGrid) {
          doc = buildDocFromTerms(v1);
        } else {
          doc = buildDocFromTable({
            cols: ["a"],
            rows: [{a: ""}],
          });
        }
        const err = [];
        const val = {
          ...v0,
          ...v1,
          doc,
        };
        resume(err, val);
      });
    });
  }

  INITIALIZE_GRID(node, options, resume) {
    this.visit(node.elts[1], options, async (e1, v1) => {
      this.visit(node.elts[0], options, async (e0, v0) => {
        const data = options?.data || {};
        const initializeGrid =
              data.initializeGrid !== undefined
              ? data.initializeGrid
              : v0;
        const err = [];
        console.log("GRID() initializeGrid=" + initializeGrid);
        console.log("GRID() v0=" + JSON.stringify(v0, null, 2));
        console.log("GRID() v1=" + JSON.stringify(v1, null, 2));
        const val = {
          ...v1,
          initializeGrid,
        };
        resume(err, val);
      });
    });
  }

  TABLE(node, options, resume) {
    this.visit(node.elts[1], options, async (e1, v1) => {
      this.visit(node.elts[0], options, async (e0, v0) => {
        const err = [];
        const val ={
          ...v0,
          ...v1
        };
        resume(err, val);
      });
    });
  }

  PROBLEM_STATEMENT(node, options, resume) {
    this.visit(node.elts[0], options, async (e0, v0) => {
      const err = [];
      const val = {
        problemStatement: v0,
      };
      resume(err, val);
    });
  }

  EXPRESSION(node, options, resume) {
    this.visit(node.elts[0], options, async (e0, v0) => {
      const data = options?.data || {};
      const err = [];
      const expr = data.expression || v0;
      const exprNode = Parser.create({allowThousandsSeparator: true}, expr);
      const terms = [
        expandNumber(exprNode.args[0].args[0]),
        expandNumber(exprNode.args[1].args[0]),
      ];
      const html = katex.renderToString(v0, {
        displayMode: true,
        output: "html",
        throwOnError: false
      });
      console.log("EXPRESSION() html=" + html);
      const val = {
        expression: expr,
        op: exprNode.op,
        terms,
        html,
      };
      resume(err, val);
    });
    const expandNumber = val => {
      const parts = val.split("");
      const terms = parts.reverse().map((part, index) => part * 10 ** index);
      return terms;
    };
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
      const err = e0;
      const val = v0.pop();
      console.log("PROG() val=" + JSON.stringify(val, null, 2));
      resume(err, {
        ...val,
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
