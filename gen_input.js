const fs = require("fs");
function genInputzkRepl(text, len) {
  let result = new Array(len).fill("");
  for (let i = 0; i < text.length; i++) {
    result[i] = text.charCodeAt(i).toString();
  }
  //   console.log("ree: ", result);
  return result;
}

// let text = "1=a 2=b 2=bc 2=c da 1=a 2=cb 2=c 2=b dd";
let text = fs.readFileSync("./short_email_wallet.txt").toString();
console.log("lennn: ", text.length);
// let text = "adsfasd DKI: v=12/; d=22; a=//121; d=1; bh=xUqTs2T2FPGCOB52 sdflj";
fs.writeFile(
  "input_arr.txt",
  JSON.stringify(genInputzkRepl(text, 1536)),
  function (err) {
    if (err) throw err;
    console.log("Array saved to file!");
  }
);
