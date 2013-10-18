// Syntax Optimization
// -------------------

function optimizeSyntax(stx) {
  var inp = input(stx);
  var res = [];
  var toks, opt;
  while (inp.buffer.length) {
    if (inp.peek()[0].userCode) {
      res.push(inp.take()[0]);
    } else if (toks = inp.takeAPeek({ type: T.Keyword }, PARENS, BRACES)) {
      if (matchesToken(IF, toks[0])) {
        opt = optimizeIfs(toks);
      } else if (matchesToken(FOR, toks[0])) {
        opt = optimizeFors(toks);
      } else {
        toks[2].token.inner = optimizeSyntax(toks[2].token.inner);
        opt = toks;
      }
      res = res.concat(opt);
    } else if (toks = inp.takeAPeek(ELSE, BRACES)) {
      res = res.concat(optimizeElses(toks));
    } else if (toks = inp.takeAPeek(BRACES)) {
      res = res.concat(optimizeSyntax(toks[0].token.inner));
      break;
    } else if (toks = inp.takeAPeek(CONTINUE)) {
      res.push(toks[0]);
      break;
    } else {
      res.push(inp.take()[0]);
    }
  }
  return res;
}

function optimizeIfs(stx) {
  var pred  = stx[1];
  var block = stx[2];
  var inner = input(optimizeSyntax(block.token.inner));
  var toks  = inner.takeAPeek(IF, PARENS, BRACES);
  if (toks && inner.buffer.length === 0) {
    pred.token.inner = pred.token.inner.concat(makePunc('&&'), toks[1]);
    stx[2] = toks[2];
  } else if (toks) {
    block.token.inner = toks.concat(inner.buffer);
  } else {
    block.token.inner = inner.buffer;
  }
  return stx;
}

function optimizeElses(stx) {
  var block = stx[1];
  var inner = input(optimizeSyntax(block.token.inner));
  var toks  = inner.takeAPeek(IF, PARENS, BRACES);
  if (toks && inner.buffer.length === 0) {
    return [stx[0]].concat(toks);
  } else if (toks) {
    block.token.inner = toks.concat(inner.buffer);
  } else {
    block.token.inner = inner.buffer;
  }
  return stx;
}

function optimizeFors(stx) {
  var inner = optimizeSyntax(stx[2].token.inner);
  for (var i = 0, t; t = inner[i]; i++) {
    if (matchesToken({ type: T.Keyword, value: 'continue' }, t)) {
      inner = inner.slice(0, i);
      break;
    }
  }
  stx[2].token.inner = inner;
  return stx;
}