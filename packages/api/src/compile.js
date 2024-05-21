import { compiler } from './compiler.js';
export async function compile({ auth, authToken, code, data, config }) {
  console.log("compile() code=" + JSON.stringify(code, null, 2));
  console.log("compile() data=" + JSON.stringify(data, null, 2));
  return await new Promise((resolve, reject) =>
    compiler.compile(code, data, config, (err, data) => {
      if (err && err.length) {
        reject({error: err});
      } else {
        resolve(data);
      }
    })
  );
}
