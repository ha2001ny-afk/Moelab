#!/usr/bin/env node
/* يحقن محرك الوزاريات + أسئلة كل محاكاة داخل ملف المحاكاة نفسه.
   الاستعمال:  node tools/ministerial/build.js          (فحص + حقن)
               node tools/ministerial/build.js --check  (فحص فقط بدون كتابة)
   لا يكتب أي ملف إذا وُجد خطأ واحد في البيانات. */
const fs = require('fs'), path = require('path');
const HERE = __dirname, ROOT = path.resolve(HERE, '..', '..');
const START = '<!--MOE-MIN:START-->', END = '<!--MOE-MIN:END-->';
const checkOnly = process.argv.includes('--check');

const css = fs.readFileSync(path.join(HERE, 'engine.css'), 'utf8');
const engine = fs.readFileSync(path.join(HERE, 'engine.js'), 'utf8');

const all = {};
for (const f of fs.readdirSync(path.join(HERE, 'data')).filter(f => f.endsWith('.js')).sort()) {
  const d = require(path.join(HERE, 'data', f));
  for (const k of Object.keys(d)) {
    if (all[k]) throw new Error(`المحاكاة ${k} مكررة في أكثر من ملف بيانات`);
    all[k] = { data: d[k], src: f };
  }
}

const errors = [];
const TAG = /^(\d\/\d{4}|\d{4})( .+)?$|^أسئلة .+$/;
for (const [key, { data, src }] of Object.entries(all)) {
  const E = m => errors.push(`${src} → ${key}: ${m}`);
  const file = path.join(ROOT, key + '.html');
  if (!fs.existsSync(file)) { E(`ملف المحاكاة ${key}.html غير موجود`); continue; }
  if (!Array.isArray(data.qs) || !data.qs.length) { E('لا توجد أسئلة'); continue; }
  data.qs.forEach((q, i) => {
    const e = m => E(`السؤال ${i + 1} (${(q.q || '').slice(0, 30)}…): ${m}`);
    if (!q.type || !q.q) e('ينقصه type أو q');
    if (q.sec && data.sections && !data.sections[q.sec]) e(`القسم ${q.sec} غير معرّف`);
    if (q.hl && !(data.names || {})[q.hl]) e(`الجزء ${q.hl} ليس له اسم في names`);
    const blanks = (q.q.match(/\{[^}]+\}/g) || []).length;
    const kinds = [!!q.a, blanks > 0, !!q.opts, !!q.items].filter(Boolean).length;
    if (kinds !== 1) e('يجب أن يكون للسؤال جواب واحد فقط: a أو {فراغ} أو opts أو items');
    if (q.opts && !(Number.isInteger(q.ans) && q.ans >= 0 && q.ans < q.opts.length)) e('رقم الخيار الصحيح ans خطأ');
    if (q.items) q.items.forEach((it, j) => { if (!it.t || !(it.a || q.common)) e(`الفقرة ${j + 1} ينقصها نص أو جواب`); (it.tags || []).forEach(t => TAG.test(t) || e(`تاگ غير مفهوم: ${t}`)); });
    (q.tags || []).forEach(t => TAG.test(t) || e(`تاگ غير مفهوم: ${t}`));
    if (/[{}]/.test(q.q.replace(/\{[^{}]+\}/g, ''))) e('أقواس فراغ غير متوازنة');
  });
}
if (errors.length) { console.error('❌ أخطاء — لم يُكتب أي ملف:\n' + errors.join('\n')); process.exit(1); }

let changed = 0;
for (const [key, { data }] of Object.entries(all)) {
  const file = path.join(ROOT, key + '.html');
  let html = fs.readFileSync(file, 'utf8');
  const a = html.indexOf(START), b = html.indexOf(END);
  if (a >= 0 && b > a) { let e = b + END.length; if (html.lastIndexOf('</body>') < 0 && html[e] === '\n' && e === html.length - 1) e++; html = html.slice(0, a) + html.slice(e); }
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  const block = `${START}\n<style>\n${css}\n</style>\n<script>window.MOE_MIN_DATA=${json};</script>\n<script>\n${engine}\n</script>\n${END}`;
  const i = html.lastIndexOf('</body>');
  /* ملف بدون </body>: يُضاف القسم في نهاية الملف (مع سطر جديد واحد يُزال عند إعادة البناء) */
  const out = i >= 0 ? html.slice(0, i) + block + html.slice(i) : html + block + '\n';
  if (!checkOnly && out !== fs.readFileSync(file, 'utf8')) { fs.writeFileSync(file, out); changed++; }
  console.log(`✔ ${key}: ${data.qs.length} سؤال`);
}
console.log(checkOnly ? '✔ الفحص سليم' : `✔ تم — ${changed} ملف تغيّر`);
