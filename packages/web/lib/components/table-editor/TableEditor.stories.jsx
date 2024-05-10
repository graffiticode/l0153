import { TableEditor } from './TableEditor';

export default {
  title: 'L0153',
  component: TableEditor,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export const Default = {
  args: {
    state: {
      apply() {},
      data: {
        "problemStatement": "Create an area model for the expression: ",
        "expression": "12\\times34",
        "op": "\\times",
        "terms": [
          [
            2,
            10
          ],
          [
            4,
            30
          ]
        ],
        "html": "<span class=\"katex-display\"><span class=\"katex\"><span class=\"katex-html\" aria-hidden=\"true\"><span class=\"base\"><span class=\"strut\" style=\"height:0.7278em;vertical-align:-0.0833em;\"></span><span class=\"mord\">12</span><span class=\"mspace\" style=\"margin-right:0.2222em;\"></span><span class=\"mbin\">×</span><span class=\"mspace\" style=\"margin-right:0.2222em;\"></span></span><span class=\"base\"><span class=\"strut\" style=\"height:0.6444em;\"></span><span class=\"mord\">34</span></span></span></span></span>",
        "initializeGrid": false,
        "gridDoc": {
          "type": "doc",
          "content": [{
            "type": "table",
            "content": [
              {
                "type": "table_row",
                "content": [
                  {
                    "type": "table_cell",
                    "attrs": {
                      "colspan": 1,
                      "rowspan": 1,
                      "colwidth": null,
                      "width": "50px",
                      "height": "50px",
                      "background": "#fff"
                    },
                    "content": [
                      {
                        "type": "paragraph",
                        "content": ""
                      }
                    ]
                  },
                  {
                    "type": "table_cell",
                    "attrs": {
                      "colspan": 1,
                      "rowspan": 1,
                      "colwidth": null,
                      "width": "50px",
                      "height": "50px",
                      "background": "#fff"
                    },
                    "content": [
                      {
                        "type": "paragraph",
                        "content": ""
                      }
                    ]
                  }
                ]
              },
              {
                "type": "table_row",
                "content": [
                  {
                    "type": "table_cell",
                    "attrs": {
                      "colspan": 1,
                      "rowspan": 1,
                      "colwidth": null,
                      "width": "50px",
                      "height": "50px",
                      "background": "#fff"
                    },
                    "content": [
                      {
                        "type": "paragraph",
                        "content": ""
                      }
                    ]
                  },
                  {
                    "type": "table_cell",
                    "attrs": {
                      "colspan": 1,
                      "rowspan": 1,
                      "colwidth": null,
                      "width": "50px",
                      "height": "50px",
                      "background": "#fff"
                    },
                    "content": [
                      {
                        "type": "paragraph",
                        "content": ""
                      }
                    ]
                  }
                ]
              }
            ]
          }
                     ]
        },
        "columnDoc": {
          "type": "doc",
          "content": [
            {
              "type": "table",
              "content": [{
                "type": "table_row",
                "content": [
                  {
                    "type": "table_cell",
                    "attrs": {
                      "colspan": 1,
                      "rowspan": 1,
                      "colwidth": null,
                      "width": "50px",
                      "height": "50px",
                      "background": "#fff"
                    },
                    "content": [
                      {
                        "type": "paragraph",
                        "content": ""
                      }
                    ]
                  }
                ]
              }, {
                "type": "table_row",
                "content": [
                  {
                    "type": "table_cell",
                    "attrs": {
                      "colspan": 1,
                      "rowspan": 1,
                      "colwidth": null,
                      "width": "50px",
                      "height": "50px",
                      "background": "#fff"
                    },
                    "content": [
                      {
                        "type": "paragraph",
                        "content": ""
                      }
                    ]
                  }
                ]
              }]
            }
          ]
        },
      }
    }
  }
};
