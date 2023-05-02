// gen DFA, tagged version
const lexical = require("./lexical");
const gen_dfa = require("./gen_DFA");
const path = require("path");
const regexpTree = require("regexp-tree");
const assert = require("assert");
const { group } = require("console");

const a2z = "a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z";
const A2Z = "A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z";
const r0to9 = "0|1|2|3|4|5|6|7|8|9";
const alphanum = `${a2z}|${A2Z}|${r0to9}`;

const key_chars = `(${a2z})`;
// hypothesis: is key_chars in email only limit to these chars below?
const succ_key_chars = "(v|a|c|d|s|t|h)";
const catch_all =
  "(0|1|2|3|4|5|6|7|8|9|a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z|A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z|!|\"|#|$|%|&|'|\\(|\\)|\\*|\\+|,|-|.|\\/|:|;|<|=|>|\\?|@|\\[|\\\\|]|^|_|`|{|\\||}|~| |\t|\n|\r|\x0b|\x0c)";
// Not the same: \\[ and ]
const catch_all_without_semicolon =
  "(0|1|2|3|4|5|6|7|8|9|a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z|A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z|!|\"|#|$|%|&|'|\\(|\\)|\\*|\\+|,|-|.|\\/|:|<|=|>|\\?|@|\\[|\\\\|]|^|_|`|{|\\||}|~| |\t|\n|\r|\x0b|\x0c)";

const email_chars = `${alphanum}|_|.|-`;
const base_64 = `(${alphanum}|\\+|\\/|=)`;
const word_char = `(${alphanum}|_)`;
const a2z_nosep = "abcdefghijklmnopqrstuvwxyz";
const A2Z_nosep = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const r0to9_nosep = "0123456789";
const email_address_regex = `([a-zA-Z0-9._%\\+-]+@[a-zA-Z0-9.-]+.[a-zA-Z0-9]+)`;

// Assume submatch already given by order of (
// check if we should put submatch start "S" tag on that index or not
function checkBeginGroup(index, submatches) {
  let result = [];
  for (let i = 0; i < submatches.length; i++) {
    for (let j = 0; j < submatches[i].length; j++) {
      if (submatches[i][j][0] == index) {
        // result.push(i);
        result.push(JSON.stringify([i, j]));
        break;
      }
    }
  }
  if (result.length != 0) {
    return result;
  }
  return false;
}
// reverse order
// check if we should put submatch end "E" tag on that index or not
function checkEndGroup(index, submatches) {
  let result = [];
  for (let i = submatches.length - 1; i >= 0; i--) {
    // new
    for (let j = 0; j < submatches[i].length; j++) {
      //
      if (submatches[i][j][1] == index) {
        // result.push(i);
        result.push(JSON.stringify([i, j]));
        break;
      }
      //
    }
    //
  }
  if (result.length != 0) {
    return result;
  }
  return false;
}

// M1 region

// create M1 from regex
// text is basically the naive regex
// submatches = [[begin1, end1], [begin2, end2], ...]
function regexToM1(text, submatches) {
  "use strict";
  function generateGraph(node, start, end, count, submatches, memS, memE) {
    var i,
      last,
      temp,
      tempStart,
      tempEnd,
      beginTag,
      endTag,
      realStart,
      interEnd;
    // console.log("beginninggg");
    // console.log("Node id ", node);
    // console.log("start state b4: ", start);
    // console.log("end state b4: ", end);
    // console.log("count: ", count);
    // console.log("submatch: ", submatches);
    // console.log("memS: ", memS);
    // console.log("memE: ", memE);
    if (!start.hasOwnProperty("id")) {
      start.id = count;
      count += 1;
    }
    realStart = start;
    beginTag = checkBeginGroup(node.begin, submatches);
    // console.log("beginTag: ", beginTag);
    endTag = checkEndGroup(node.end - 1, submatches);
    // console.log("EndTag: ", endTag);

    if (beginTag) {
      temp = start;
      last = start;
      for (let i = 0; i < beginTag.length; i++) {
        // WHY memS and memE --> not repeat tag with group that overlaps in node.begin, node.end
        if (!memS.includes(beginTag[i])) {
          memS.push(beginTag[i]);
          last = { type: "", edges: [] };
          // temp.edges.push([["S", beginTag[i]], last]);
          // temp.edges.push([["S", JSON.parse(beginTag[i])[0]], last]);
          temp.edges.push(["S" + JSON.parse(beginTag[i])[0], last]);
          last.id = count;
          count += 1;
          temp = last;
        }
      }
      realStart = last;
      // console.log("real ", realStart);
    }
    // interEnd is stuffs state before end. Use as end in this stuffs. will assign id at the end.
    interEnd = end;
    if (endTag) {
      var newTag = [];

      for (let i = 0; i < endTag.length; i++) {
        // WHY memS and memE
        if (!memE.includes(endTag[i])) {
          newTag.push(endTag[i]);
        }
      }
      if (newTag.length >= 1) {
        interEnd = { type: "", edges: [] };
        temp = interEnd;
        last = interEnd;
        for (let i = 0; i < newTag.length - 1; i++) {
          memE.push(newTag[i]);
          last = { type: "", edges: [] };
          // temp.edges.push([["E", newTag[i]], last]);
          // temp.edges.push([["E", JSON.parse(newTag[i])[0]], last]);
          temp.edges.push(["E" + JSON.parse(newTag[i])[0], last]);
          temp = last;
        }
        memE.push(newTag[newTag.length - 1]);
        // last.edges.push([["E", newTag[newTag.length - 1]], end]);
        // last.edges.push([["E", JSON.parse(newTag[newTag.length - 1])[0]], end]);
        last.edges.push(["E" + JSON.parse(newTag[newTag.length - 1])[0], end]);
      } else {
        interEnd = end;
      }
    }

    switch (node.type) {
      // Ignore this case first :)
      // case "empty":
      //   let mem = realStart.type + end.type;
      //   end = realStart;
      //   end.type = mem;
      //   return [count, end];
      case "text":
        // realStart.edges.push([[node.text], interEnd]);
        realStart.edges.push([node.text, interEnd]);
        break;
      case "cat":
        last = realStart;
        for (i = 0; i < node.parts.length - 1; i += 1) {
          temp = { type: "", edges: [] };
          let result = generateGraph(
            node.parts[i],
            last,
            temp,
            count,
            submatches,
            memS,
            memE
          );
          count = result[0];
          temp = result[1];
          last = temp;
        }
        count = generateGraph(
          node.parts[node.parts.length - 1],
          last,
          interEnd,
          count,
          submatches,
          memS,
          memE
        )[0];
        break;
      case "or":
        for (i = 0; i < node.parts.length; i += 1) {
          tempStart = { type: "", edges: [] };
          //   realStart.edges.push([["ϵ", i], tempStart]);
          realStart.edges.push(["ϵ", tempStart]);
          count = generateGraph(
            node.parts[i],
            tempStart,
            interEnd,
            count,
            submatches,
            memS,
            memE
          )[0];
        }
        break;
      //Use only greedy, maybe implement reluctant later
      case "star":
        tempStart = { type: "", edges: [] };
        tempEnd = {
          type: "",
          //   edges: [
          //     [["ϵ", 0], tempStart],
          //     [["ϵ", 1], interEnd],
          //   ],
          edges: [
            ["ϵ", tempStart],
            ["ϵ", interEnd],
          ],
        };
        // realStart.edges.push([["ϵ", 0], tempStart]);
        // realStart.edges.push([["ϵ", 1], interEnd]);
        realStart.edges.push(["ϵ", tempStart]);
        realStart.edges.push(["ϵ", interEnd]);
        count = generateGraph(
          node.sub,
          tempStart,
          tempEnd,
          count,
          submatches,
          memS,
          memE
        )[0];
        break;
    }
    var backMargin = interEnd;
    // console.log("check: ", backMargin);
    while (backMargin != end) {
      if (!backMargin.hasOwnProperty("id")) {
        backMargin.id = count;
        count += 1;
      }
      backMargin = backMargin.edges[0][1];
    }
    if (!end.hasOwnProperty("id")) {
      end.id = count;
      count += 1;
    }
    // console.log("start state after: ", start);
    // console.log("end state after: ", end);
    return [count, end];
  }

  // New: simplifyRegex and simplify Plus
  var after_plus = gen_dfa.simplifyPlus(
    gen_dfa.simplifyRegex(text),
    submatches
  );

  // console.log("afterrr; ", after_plus["submatches"]);
  var ast = lexical.parseRegex(after_plus["regex"]),
    start = { type: "start", edges: [] },
    accept = { type: "accept", edges: [] };
  // console.log("Before plus: ", gen_dfa.simplifyRegex(text));
  // console.log("Plus works: ", after_plus["regex"]);
  // console.log("submatchh: ", submatches);
  if (typeof ast === "string") {
    return ast;
  }
  // console.log("ast: ", ast);
  // console.log("part 5: ", ast["parts"][5]);
  // console.log("part 5 OR: ", ast["parts"][5]["parts"][0]);
  // console.log("part 5 STAR: ", ast["parts"][5]["parts"][1]);
  // console.log("part 5 OR in STAR: ", ast["parts"][5]["parts"][1]["sub"]);
  // use new submatches as after_plus["submatches"] instead
  // console.log("ssss: ",after_plus["submatches"] )
  generateGraph(ast, start, accept, 0, after_plus["final_submatches"], [], []);
  return start;
}
// simplify M1 to readable format, not just node points to each other
function simplifyM1(m1) {
  function read_M1(m1, q1, trans, accepted) {
    if (q1.has(m1.id)) {
      // console.log("exist already, id: ", m1.id);
      return;
    } else {
      q1.add(m1.id);
    }
    // var edges = m1.edges;
    if (m1.type == "accept") {
      accepted.push(m1.id);
      return;
    }
    for (let i = 0; i < m1.edges.length; i++) {
      // console.log("edge of ", m1.id, " : ", m1.edges[i][0]);
      if (!trans.hasOwnProperty(m1.id)) {
        trans[m1.id] = {};
      }
      trans[m1.id][m1.edges[i][0].toString()] = m1.edges[i][1].id.toString();
      read_M1(m1.edges[i][1], q1, trans, accepted);
    }
  }
  var q1 = new Set();
  var trans = {};
  var accepted = [];
  read_M1(m1, q1, trans, accepted);
  return { q1: q1, accepted: accepted, trans: trans };
}

function readSubmatch(regex, submatches) {
  regex = gen_dfa.simplifyRegex(regex);
  // console.log("og regex: ", regex);
  var after_plus = gen_dfa.simplifyPlus(regex, submatches);
  // console.log("after plus: ", after_plus);
  // var final_regex = after_plus["regex"];
  // var final_submatches = after_plus["submatches"];
  var final_regex = after_plus["regex_show"];
  var final_submatches = after_plus["final_submatches"];
  // console.log("og submatch: ", submatches);
  // console.log("after submatch: ", final_submatches);

  console.log("len regex: ", regex.length);
  const index_color = {};
  const index_full = {};
  const color_arr = [];
  const defaultColor = "\x1b[0m";

  // color of original regex
  for (var i = 0; i < submatches.length; i++) {
    // the actual index of left is leftmost, right is rightmost
    const color = `\x1b[${(i % 7) + 31}m`;
    index_color[submatches[i][0]] = color;
    index_color[submatches[i][1]] = color;
    color_arr.push(color);
  }
  const sortedIndex = Object.keys(index_color).sort((a, b) => {
    return parseInt(a) - parseInt(b);
  });
  var result = "";
  var prev = 0;
  for (const index of sortedIndex) {
    result += regex.slice(prev, parseInt(index)) + index_color[index];
    result += regex[index] + defaultColor;
    prev = parseInt(index) + 1;
  }
  result += regex.slice(prev);

  // color of final regex
  for (var i = 0; i < final_submatches.length; i++) {
    // the actual index of left is leftmost, right is rightmost
    const color = `\x1b[${(i % 7) + 31}m`;
    for (var match of final_submatches[i]) {
      index_full[match[0]] = color;
      index_full[match[1]] = color;
    }
  }
  const final_sortedIndex = Object.keys(index_full).sort((a, b) => {
    return parseInt(a) - parseInt(b);
  });
  var final_result = "";
  var final_prev = 0;
  for (const index of final_sortedIndex) {
    final_result +=
      final_regex.slice(final_prev, parseInt(index)) + index_full[index];
    final_result += final_regex[index] + defaultColor;
    final_prev = parseInt(index) + 1;
  }
  final_result += final_regex.slice(final_prev);

  // group color
  var group_color = "Group: ";
  for (var i = 0; i < color_arr.length; i++) {
    group_color += color_arr[i] + i + defaultColor + ", ";
  }
  console.log(group_color.slice(0, group_color.length - 2));
  console.log("input regex: ", result);
  console.log("final regex: ", final_result);
}
function hello() {
  console.log("hello from gen");
}
// function
module.exports = {
  readSubmatch,
  regexToM1,
  simplifyM1,
  hello,
};
