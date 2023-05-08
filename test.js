const fs = require("fs");
const gen = require("./gen");
const gen_dfa = require("./gen_dfa");
const lexical = require("./lexical");
const gen_tagged_dfa = require("./gen_tagged_dfa");

const a2z = "a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z";
const a2b = "a|b";
const a2f = "a|b|c|d|e|f";
const A2Z = "A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z";
const r0to9 = "0|1|2|3|4|5|6|7|8|9";
const alphanum = `${a2z}|${A2Z}|${r0to9}`;
// const alphabet = `${a2z}|${A2Z}|${r0to9}|-|\\/`;

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

// Example
// const text = fs.readFileSync("./test.txt").toString();
// const regex = "DKI: (([vad]=([12\\/]+); )+)bh";
// // const submatches = [
// //   [5, 30],
// //   [7, 13],
// //   [15, 25],
// // ];
// const submatches = [[1, 31]];
// gen.readSubmatch(regex, submatches);
// gen_tagged_dfa.finalRegexExtractState(regex, submatches, text);
// const tagged_simp_graph = gen_tagged_dfa.tagged_simplifyGraph(
//   regex,
//   submatches
// );
// var final_graph = gen_tagged_dfa.findMatchStateTagged(tagged_simp_graph);
// console.log("final graph: ", final_graph);
// const tagged_simp_graph = gen_tagged_dfa.tagged_simplifyGraph(
//   regex,
//   submatches
// );
// var final_graph = gen_tagged_dfa.findMatchStateTagged(tagged_simp_graph);
// console.log("final final graph: ", gen_tagged_dfa.formatForCircom(final_graph));

// EMAIL wallet

const email_wallet_text = fs.readFileSync("./email_wallet.txt").toString();
// const extension =
//   "-|\\/|.|\"|#|$|%|&|'|\\(|\\)|\\*|\\+|:|<|=|>|\\?|@|\\[|]|^|_|`|{|\\||}|~| |\t|\n|\r|\x0b|\x0c";
// // const alphabet = `${a2z}|${A2Z}|${r0to9}|${extension}`;
// // const alphabet = `[A-Z]|[a-z]|[0-9]|${extension}`;
// const alphabet =
//   "[A-Z]|[a-z]|[0-9]|-|\\/|.|\"|#|$|%|&|'|\\(|\\)|\\*|\\+|:|<|=|>|\\?|@|\\[|]|^|_|`|{|\\||}|~| |\t|\n|\r|\x0b|\x0c";
// // const sig_regex = `\nDKIM-Signature: (${succ_key_chars}=((${alphabet})+);( |\t|\n|\r|\x0b|\x0c)*)+ bh`;
// const sig_regex =
//   "\nDKIM-Signature: ((v|a|c|d|s|t|h)=(([A-Z]|[a-z]|[0-9]|-|\\/|.|\"|#|$|%|&|'|\\(|\\)|\\*|\\+|:|<|=|>|\\?|@|\\[|]|^|_|`|{|\\||}|~| |\t|\n|\r|\x0b|\x0c)+);( |\t|\n|\r|\x0b|\x0c)*)+ bh";
// // const submatches = [
// //   [18, 32],
// //   [34, 236],
// // ];
// const submatches = [
//   [18, 32],
//   [34, 242],
// ];
// gen.readSubmatch(sig_regex, submatches);
// gen_tagged_dfa.finalRegexExtractState(sig_regex, submatches, email_wallet_text);

// Donate
// const text =
//   "Hi Jern, Thanks very much for your kindness. You've successfully donated 54.3 USD to climate, donated 60.5 USD to childcare, and 10000 USD to 0xParc. Share this to friends!";
// const regex =
//   "([Dd]onated|and) ([0-9]+(.[0-9]+)?) USD to (0xParc|climate|childcare|infra)";
// const submatches = [[18, 65]];
// gen.readSubmatch(regex, submatches);
// gen_tagged_dfa.finalRegexExtractState(regex, submatches, text);

// Deal with epsilon
const text =
  "Hi Jern, Thanks very much for your kindness. You've successfully donated $54.3 USD to climate, donated 60.5 USD to childcare, and 10000 USD to 0xParc. Share this to friends!";
const regex =
  "([Dd]onated|and) ($)?([0-9]+(.[0-9]+)?) USD to (0xParc|climate|childcare|infra)";
const submatches = [[22, 71]];
gen.readSubmatch(regex, submatches);
gen_tagged_dfa.finalRegexExtractState(regex, submatches, text);
