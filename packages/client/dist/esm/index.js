import{jsx as e}from"react/jsx-runtime";function r(r){var t=r.state;console.log("render() search="+window.location.search);var a=new URLSearchParams(window.location.search).get("url");console.log("render() url="+a);var n=t.data;return"string"==typeof n.hello?e("span",{className:"text-sm",children:"hello, ".concat(n.hello,"!")}):function(r,t){return delete r.schema,e("pre",{className:"text-xs",children:JSON.stringify(r,null,2)})}(n)}var t=function(t){var a=t.state;return e("div",{className:"p-2",children:r({state:a})})};export{t as Form};
//# sourceMappingURL=index.js.map
