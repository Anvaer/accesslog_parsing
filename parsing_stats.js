const args = process.argv.slice(2);

// logs file name
const FILENAME = args[0];
// show urls with greater frequency only
const SHOW_FREQ = args[1] || 1000;
// replace node with * if count of word variants is greater than the limit
const LIMIT = args[2] || 100;
// do not replace node with * if frequency greater than KEEP_FREQUENCY * LIMIT
const KEEP_FREQUENCY = args[3] || 0.05;
// regex to get URL from each line
const URL_REGEX = new RegExp(/^[^"]+"(\w+ [^" ]+)/i);

if (FILENAME === undefined)
  console.error("You should pass logs file name as an argument");

const lineReader = require("readline").createInterface({
  input: require("fs").createReadStream(FILENAME),
});

const rootNodes = [];
const rootNodesIdx = {};

const sepRegex = new RegExp(/([\/\?&= ])/i);

const urlToNodes = (url) => {
  return url.split(sepRegex).filter((s) => s !== "");
};

let rowNum = 0;
const readFirstNRows = Infinity;

lineReader.on("line", function (line) {
  if (rowNum === 0) console.time("building tree");
  if (rowNum < readFirstNRows) {
    const urlM = line.match(URL_REGEX);
    if (urlM) {
      const url = urlM[1];
      const els = urlToNodes(url);
      let rn;
      if (rootNodesIdx[els[0]] === undefined) {
        rn = { val: els[0], count: 1, childs: [], childsIdx: {} };
        rootNodesIdx[els[0]] = rootNodes.length;
        rootNodes.push(rn);
      } else {
        rn = rootNodes[rootNodesIdx[els[0]]];
        rn.count++;
      }
      els.slice(1).forEach((e) => {
        let cn;
        if (rn.childsIdx[e] === undefined) {
          cn = { val: e, count: 1, childs: [], childsIdx: {} };
          rn.childsIdx[e] = rn.childs.length;
          rn.childs.push(cn);
        } else {
          cn = rn.childs[rn.childsIdx[e]];
          cn.count++;
        }
        rn = cn;
      });
    }
    rowNum++;
  }
});

function countSum(nodes) {
  return nodes.map((n) => n.count).reduce((a, c) => (a += c), 0);
}

function outputTree(t, minCount = 0, indent = "") {
  if (t.count >= minCount) {
    console.log(indent + t.val + " : " + t.count);
    t.childs.forEach((c) => outputTree(c, minCount, indent + " "));
  }
}

function outputChains(t, minCount = 0) {
  const chains = [];
  gathersChains(chains, t, minCount);
  return chains;
}

function gathersChains(chains, t, minCount = 0, prefix = "") {
  const curChainCount = t.count - countSum(t.childs);
  if (curChainCount >= minCount)
    chains.push({ name: prefix + t.val, count: curChainCount });
  t.childs.forEach((c) => gathersChains(chains, c, minCount, prefix + t.val));
}

function merge(nodes) {
  const mergedNodes = nodes.reduce(
    (a, c) => {
      const existing =
        a.childsIdx[c.val] !== undefined
          ? a.childs[a.childsIdx[c.val]]
          : undefined;
      if (existing) {
        existing.count += c.count;
        if (c.childs.length > 0) {
          Object.assign(existing, merge([...existing.childs, ...c.childs]));
        }
      } else {
        a.childsIdx[c.val] = a.childs.length;
        a.childs.push(c);
      }
      return a;
    },
    { childs: [], childsIdx: {} }
  );

  return mergedNodes;
}

function reduceTree(
  t,
  limit = 10,
  keepFrequency = 0.05,
  keepMask = undefined // /[\/\?&= ]+/i // keep separators by default
) {
  if (t.childs.length >= limit) {
    const ccSum = countSum(t.childs);
    const keepingCount = ccSum * keepFrequency;

    const [childsToKeep, childsToGroup] = t.childs.reduce(
      ([childsToKeep, childsToGroup], c) => {
        if (
          c.count >= keepingCount ||
          c.val.match(sepRegex) ||
          (keepMask && c.val.match(keepMask))
        )
          childsToKeep.push(c);
        else childsToGroup.push(c);
        return [childsToKeep, childsToGroup];
      },
      [[], []]
    );
    const cc = {
      val: "*",
      count: countSum(childsToGroup),
      ...merge(childsToGroup.flatMap((c) => c.childs)),
    };
    const debug = false; //t.childs.find((c) => c.val === "1124578");
    if (debug) {
      console.log("************************************ reducing");
      t.childs.sort((a, b) => b.count - a.count);
      console.log(
        t.childs.map(
          (c) =>
            c.val +
            " : " +
            c.count +
            " (" +
            ((c.count / ccSum) * 100).toFixed(2) +
            "%)"
        )
      );
    }

    Object.assign(t, merge([...childsToKeep, cc]));

    if (debug) {
      console.log(t.childs.map((c) => c.val + " : " + c.count));
      console.log("************************************ ");
    }
  }
  t.childs.forEach((c) => reduceTree(c, limit, keepFrequency, keepMask));
}

lineReader.on("close", function () {
  console.timeEnd("building tree");
  console.log(`parsed ${rowNum} rows`);
  console.time("reducing tree");
  rootNodes.forEach((rn) => reduceTree(rn, LIMIT, KEEP_FREQUENCY));
  console.timeEnd("reducing tree");
  console.time("printing tree");
  // rootNodes.forEach((rn) => outputTree(rn, SHOW_FREQ));
  const chains = rootNodes.flatMap((rn) => outputChains(rn, SHOW_FREQ));
  chains.sort((a, b) => b.count - a.count);
  chains.forEach((c) => console.log(c.count + " : " + c.name));

  console.timeEnd("printing tree");
});
