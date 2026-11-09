import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import ts from 'typescript';
import {EDITORIAL_IMAGES,SCENARIO_IMAGES,LANDING_PLAN_IMAGES,GUIDE_IMAGES} from '../lib/editorial-images.ts';
import {SITE_NAVIGATION} from '../lib/site-navigation.ts';
import {navigationVisual} from '../lib/navigation-presentation.ts';

process.chdir(fileURLToPath(new URL('../',import.meta.url)));
const hashes=new Map(),used=new Set(),destinations=new Map();
for(const id of Object.keys(EDITORIAL_IMAGES)) {
  for(const width of [900,1500]) {
    const path=`public/assets/editorial/${id}${width===900?'-900':''}.webp`;
    if(!existsSync(path))throw Error(`Missing image: ${path}`);
    const metadata=await sharp(path).metadata();
    if(metadata.width!==width||metadata.height!==width*2/3)throw Error(`Wrong dimensions: ${path}`);
  }
  const pixels=await sharp(`public/assets/editorial/${id}.webp`).raw().toBuffer();
  const hash=createHash('sha256').update(pixels).digest('hex');
  if(hashes.has(hash))throw Error(`Identical images under different names: ${id}, ${hashes.get(hash)}`);
  hashes.set(hash,id);
}
function check(id,section,where) {
  if(/^\/assets\/(equipment|accessories)\//.test(id)) {
    if(section!=='equipment'||!existsSync('public'+id))throw Error(`Invalid catalog photo ${id} in ${where}`);
    return;
  }
  const item=EDITORIAL_IMAGES[id];
  if(!item)throw Error(`Unknown scene ${id} in ${where}`);
  if(item.section!==section)throw Error(`${where}: ${id} belongs to ${item.section}, not ${section}`);
  used.add(id);
}
for(const group of SITE_NAVIGATION)for(const item of group.items) {
  const image=navigationVisual(item.href).image;if(!image)continue;
  if(!existsSync('public'+image))throw Error(`Missing menu image: ${image}`);
  const links=destinations.get(image)??new Set();links.add(item.href);destinations.set(image,links);
  if(links.size>1)throw Error(`One menu photo points at different destinations: ${[...links].join(', ')}`);
  const match=image.match(/^\/assets\/editorial\/(.+)-900\.webp$/);
  if(match)check(match[1],item.href.split('/')[1].split('#')[0],item.href);
}
const bindings={SCENARIO_IMAGES,LANDING_PLAN_IMAGES,GUIDE_IMAGES};
const pages={
  'components/Landing.tsx':'landing','components/PlansPage.tsx':'plans','components/ScenarioPage.tsx':'plans',
  'components/TechnologyPage.tsx':'technology','components/EquipmentPage.tsx':'equipment','components/EquipmentCollections.tsx':'equipment',
  'components/CoveragePage.tsx':'coverage','components/ConnectWizard.tsx':'connect','components/GuidesPage.tsx':'guides',
  'components/SpeedtestPage.tsx':'speedtest','components/SupportPage.tsx':'support','components/Account.tsx':'account',
  'app/privacy/page.tsx':'privacy',
};
for(const [file,section]of Object.entries(pages)) {
  const source=ts.createSourceFile(file,readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  function values(expression) {
    if(!expression)return [];
    if(ts.isStringLiteral(expression))return [expression.text];
    if(ts.isConditionalExpression(expression))return [...values(expression.whenTrue),...values(expression.whenFalse)];
    if(ts.isAsExpression(expression)||ts.isParenthesizedExpression(expression))return values(expression.expression);
    if(ts.isElementAccessExpression(expression)&&ts.isIdentifier(expression.expression))return Object.values(bindings[expression.expression.text]??{});
    return [];
  }
  function visit(node) {
    if(ts.isJsxAttribute(node)&&node.name.getText(source)==='image'&&node.parent.parent.tagName?.getText(source)==='EditorialImage') {
      const expression=node.initializer&&ts.isJsxExpression(node.initializer)?node.initializer.expression:node.initializer;
      for(const id of values(expression))check(id,section,file);
    }
    if(ts.isPropertyAssignment(node)&&node.name.getText(source)==='image')for(const id of values(node.initializer))check(id,section,file);
    ts.forEachChild(node,visit);
  }
  visit(source);
}
const unused=Object.keys(EDITORIAL_IMAGES).filter(id=>!used.has(id));
if(unused.length)throw Error(`Scenes without a placement: ${unused.join(', ')}`);
console.log(`Verified ${hashes.size} distinct scenes, both image sizes, ${destinations.size} menu photos and section ownership in ${Object.keys(pages).length} components.`);
console.log('No identical scene files or photos assigned to unrelated sections. Repeated links to the same page are allowed.');
