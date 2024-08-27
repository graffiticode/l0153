import {
  Checker as BasisChecker,
  Transformer as BasisTransformer,
  Compiler as BasisCompiler
} from '@graffiticode/basis';

import { Parser } from '@artcompiler/parselatex';

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

const expandNumber = val => {
  const parts = val.split("");
  const terms = parts.reverse().map((part, index) => part * 10 ** index);
  return terms;
};

export class Transformer extends BasisTransformer {
  AREA_MODEL(node, options, resume) {
    this.visit(node.elts[1], options, async (e1, v1) => {
      this.visit(node.elts[0], options, async (e0, v0) => {
        const data = options?.data || {};
        const err = [];
        const val = {
          ...v0,
          ...v1,
          ...data,
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
        const val = {
          ...v1,
          initializeGrid,
        };
        resume(err, val);
      });
    });
  }

  SHOW_FEEDBACK(node, options, resume) {
    this.visit(node.elts[1], options, async (e1, v1) => {
      this.visit(node.elts[0], options, async (e0, v0) => {
        const data = options?.data || {};
        const showFeedback =
              data.showFeedback !== undefined
              ? data.showFeedback
              : v0;
        const err = [];
        const val = {
          ...v1,
          showFeedback,
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
      const val = {
        expression: expr,
        terms,
      };
      resume(err, val);
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
