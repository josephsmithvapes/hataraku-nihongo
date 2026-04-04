// Pixel art scenes for Japanese stories — Nintendo 8-bit palette, SVG-based
// Each scene is a 32×24 pixel grid rendered at 5px/cell (160×120 px, viewBox-scalable)

const C = 5; // px per cell

function px(col, row, w, h, fill) {
  return <rect x={col * C} y={row * C} width={w * C} height={h * C} fill={fill} />;
}

// NES-inspired palette
const SKY  = '#3CBCFC', SKYD = '#0058F8', SUN  = '#FCE000', WHT  = '#FCFCFC';
const GRN  = '#38B800', GRND = '#006800', BRN  = '#AC7C00', TAN  = '#FCD8A8';
const RED  = '#D82800', PINK = '#F878F8', PEACH= '#FC9848', YEL  = '#F8D878';
const WATER= '#0058F8', WATL = '#3CBCFC', TEAL = '#00B8B8', NAVY = '#000080';
const PURP = '#7800BC', GRY  = '#848484', LGRY = '#BCBCBC', BLK  = '#000000';
const ORG  = '#FC7800', MBLU = '#0078F8', STRAW= '#F8D878', BRICK= '#881400';
const STEM = '#503000', BAMB = '#38B800', BAMBD= '#006800';

const BOUNCE_CSS = `
  @keyframes pxBounce {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-4px); }
  }
  @keyframes pxFloat {
    0%,100% { transform: translateY(0px) rotate(0deg); }
    33%      { transform: translateY(-3px) rotate(1deg); }
    66%      { transform: translateY(-1px) rotate(-1deg); }
  }
  .pxchar  { animation: pxBounce 1.4s ease-in-out infinite; }
  .pxfloat { animation: pxFloat  2.2s ease-in-out infinite; }
`;

// ─── MOMOTARŌ ──────────────────────────────────────────────────────────────
// Peach boy → peach floating in river, character on bank
function MomotaroScene() {
  return (
    <g>
      {px(0,0,32,15,SKY)}
      {/* sun + rays */}
      {px(27,1,4,4,SUN)}{px(28,0,2,6,SUN)}{px(25,2,6,2,SUN)}{px(29,1,1,1,WHT)}
      {/* clouds */}
      {px(3,3,9,3,WHT)}{px(5,1,5,3,WHT)}
      {px(17,4,8,2,WHT)}{px(19,2,4,3,WHT)}
      {/* ground */}
      {px(0,15,32,9,GRN)}{px(0,15,32,1,GRND)}
      {/* river */}
      {px(10,14,12,10,WATER)}{px(10,14,12,1,TEAL)}
      {px(11,17,3,1,WATL)}{px(17,20,4,1,WATL)}{px(13,22,3,1,WATL)}
      {/* trees L */}
      {px(0,9,7,6,GRND)}{px(1,7,5,3,GRND)}{px(2,6,3,2,GRN)}{px(2,14,2,2,STEM)}
      {/* trees R */}
      {px(25,9,7,6,GRND)}{px(26,7,5,3,GRND)}{px(27,6,3,2,GRN)}{px(28,14,2,2,STEM)}

      {/* peach — floats */}
      <g className="pxfloat">
        {px(14,7,5,3,GRND)}{px(15,6,3,2,GRN)}   {/* leaf */}
        {px(13,9,6,7,RED)}{px(14,8,4,3,RED)}{px(15,7,2,2,PEACH)}
        {px(14,10,2,2,PINK)}{px(15,10,1,1,WHT)}
      </g>

      {/* Momotarō character — bounces */}
      <g className="pxchar">
        {px(7,8,3,2,RED)}{px(6,9,5,2,YEL)}     {/* hat */}
        {px(7,11,3,3,TAN)}                       {/* head */}
        {px(8,12,1,1,BLK)}{px(7,13,1,1,BLK)}   {/* eyes */}
        {px(6,14,5,3,RED)}{px(6,16,5,1,YEL)}   {/* kimono + belt */}
        {px(6,17,2,2,GRND)}{px(9,17,2,2,GRND)} {/* legs */}
      </g>
    </g>
  );
}

// ─── URASHIMA TARŌ ─────────────────────────────────────────────────────────
// Fisherman on a boat above, underwater creatures below
function UrashimaScene() {
  return (
    <g>
      {px(0,0,32,8,SKY)}
      {/* sun */}
      {px(24,1,5,5,SUN)}{px(25,0,3,7,SUN)}{px(22,2,8,3,SUN)}{px(26,1,1,1,WHT)}
      {/* horizon */}
      {px(0,8,32,2,TEAL)}
      {/* ocean mid */}
      {px(0,10,32,8,WATER)}
      {/* ocean deep */}
      {px(0,18,32,6,NAVY)}
      {/* waves */}
      {px(2,10,4,1,WATL)}{px(12,11,5,1,WATL)}{px(22,10,4,1,WATL)}{px(7,12,3,1,WATL)}{px(26,12,4,1,WATL)}

      {/* boat hull */}
      {px(5,8,20,2,STEM)}{px(4,9,22,2,BRN)}{px(5,11,18,2,STEM)}{px(7,12,14,1,BRN)}
      {/* mast */}
      {px(13,1,2,9,STEM)}
      {/* sail */}
      {px(9,2,5,7,WHT)}{px(9,2,4,6,WATL)}{px(9,3,3,4,SKY)}

      {/* Urashima — bounces */}
      <g className="pxchar">
        {px(17,4,3,2,BRN)}{px(17,5,3,3,TAN)}   {/* hat + head */}
        {px(17,7,1,1,BLK)}{px(19,7,1,1,BLK)}   {/* eyes */}
        {px(16,8,5,2,MBLU)}                      {/* kimono */}
        {px(16,10,2,2,STEM)}{px(19,10,2,2,STEM)}{/* legs */}
        {px(21,8,1,5,STEM)}                       {/* fishing rod */}
        {px(22,12,1,4,WHT)}                       {/* line */}
      </g>

      {/* fish underwater */}
      <g className="pxfloat">
        {px(8,18,5,2,ORG)}{px(6,19,3,1,ORG)}{px(13,21,4,2,YEL)}{px(11,22,3,1,YEL)}
        {px(20,19,5,2,TEAL)}{px(18,20,3,1,TEAL)}
      </g>

      {/* turtle */}
      {px(14,21,6,2,GRN)}{px(15,20,4,1,GRN)}{px(16,19,2,1,GRN)}
      {px(14,23,2,1,GRND)}{px(18,23,2,1,GRND)}
    </g>
  );
}

// ─── KAGUYA-HIME ───────────────────────────────────────────────────────────
// Moon princess — night sky, large moon, bamboo forest, glowing figure
function KaguyaScene() {
  return (
    <g>
      {px(0,0,32,24,NAVY)}
      {/* moon (circle approximation) */}
      {px(13,1,6,1,YEL)}{px(12,2,8,1,YEL)}{px(11,3,10,6,YEL)}{px(12,9,8,1,YEL)}{px(13,10,6,1,YEL)}
      {px(14,1,4,1,WHT)}{px(13,2,6,1,WHT)}{px(12,3,8,5,WHT)}{px(13,8,6,1,WHT)}{px(14,9,4,1,WHT)}
      {px(15,1,2,8,WHT)}{px(13,3,4,6,WHT)}  {/* inner glow */}
      {/* stars */}
      {px(2,2,1,1,WHT)}{px(6,1,1,1,YEL)}{px(8,5,1,1,WHT)}{px(25,1,1,1,WHT)}
      {px(28,3,1,1,YEL)}{px(30,1,1,1,WHT)}{px(3,7,1,1,WHT)}{px(29,8,1,1,WHT)}
      {px(1,10,1,1,YEL)}{px(31,5,1,1,WHT)}{px(4,13,1,1,WHT)}{px(27,11,1,1,YEL)}
      {/* ground */}
      {px(0,18,32,6,GRND)}{px(0,18,32,1,BAMB)}
      {/* bamboo L */}
      {px(2,9,2,15,BAMB)}{px(3,8,2,16,BAMBD)}{px(2,11,4,1,BAMBD)}{px(2,14,4,1,BAMBD)}
      {px(2,17,4,1,BAMBD)}
      {px(7,7,2,17,BAMB)}{px(8,6,2,18,BAMBD)}{px(7,9,4,1,BAMBD)}{px(7,13,4,1,BAMBD)}
      {px(7,17,4,1,BAMBD)}
      {/* bamboo R */}
      {px(22,8,2,16,BAMB)}{px(23,7,2,17,BAMBD)}{px(22,10,4,1,BAMBD)}{px(22,14,4,1,BAMBD)}
      {px(22,17,4,1,BAMBD)}
      {px(27,6,2,18,BAMB)}{px(28,5,2,19,BAMBD)}{px(27,8,4,1,BAMBD)}{px(27,12,4,1,BAMBD)}
      {px(27,16,4,1,BAMBD)}
      {/* bamboo leaves */}
      {px(0,9,6,2,BAMB)}{px(5,7,5,2,BAMB)}{px(20,8,5,2,BAMB)}{px(25,6,5,2,BAMB)}

      {/* Kaguya — floats */}
      <g className="pxfloat">
        {px(13,15,6,4,YEL)}{px(12,16,8,3,YEL)} {/* glow */}
        {px(14,16,4,4,WHT)}{px(14,17,4,2,PURP)} {/* robe */}
        {px(14,15,4,3,TAN)}                      {/* head */}
        {px(12,15,7,1,BLK)}{px(12,16,1,4,BLK)}{px(19,16,1,4,BLK)} {/* hair */}
        {px(15,16,1,1,BLK)}{px(17,16,1,1,BLK)} {/* eyes */}
      </g>
    </g>
  );
}

// ─── GOLDILOCKS ─────────────────────────────────────────────────────────────
// Cottage in the woods, golden-haired girl approaching
function GoldilocksScene() {
  return (
    <g>
      {px(0,0,32,13,SKY)}
      {/* forest background */}
      {px(0,7,6,6,GRND)}{px(0,5,4,3,GRND)}{px(1,4,3,2,GRN)}{px(2,3,2,2,GRND)}
      {px(26,7,6,6,GRND)}{px(28,5,4,3,GRND)}{px(28,4,3,2,GRN)}{px(29,3,2,2,GRND)}
      {/* ground */}
      {px(0,13,32,11,GRN)}{px(0,13,32,1,GRND)}
      {/* path */}
      {px(13,14,6,10,STRAW)}{px(14,14,4,10,YEL)}
      {/* cottage walls */}
      {px(9,10,14,5,STRAW)}{px(9,10,14,1,YEL)}
      {/* roof */}
      {px(8,7,16,4,BRN)}{px(9,6,14,2,BRN)}{px(11,5,10,2,BRN)}{px(13,4,6,2,STEM)}
      {/* chimney */}
      {px(11,1,3,5,GRY)}{px(11,0,3,2,LGRY)}{px(10,1,5,1,GRY)}
      {/* chimney smoke */}
      {px(12,0,1,1,LGRY)}
      {/* door */}
      {px(14,11,4,5,BRN)}{px(15,11,2,5,STEM)}{px(17,12,1,1,PEACH)} {/* knob */}
      {/* windows */}
      {px(10,11,3,3,WATL)}{px(10,11,1,1,SKY)}{px(11,12,1,1,SKY)}
      {px(19,11,3,3,WATL)}{px(20,11,1,1,SKY)}{px(19,12,1,1,SKY)}
      {/* flowers */}
      {px(9,13,1,1,RED)}{px(23,13,1,1,PINK)}{px(8,14,1,1,YEL)}{px(24,14,1,1,RED)}
      {px(7,15,1,1,PINK)}{px(25,15,1,1,YEL)}

      {/* Goldilocks — bounces */}
      <g className="pxchar">
        {px(4,10,5,2,YEL)}{px(3,11,7,2,YEL)}    {/* hair */}
        {px(5,11,4,3,TAN)}                        {/* head */}
        {px(6,12,1,1,BLK)}{px(8,12,1,1,BLK)}    {/* eyes */}
        {px(4,14,5,3,PINK)}{px(5,14,3,3,RED)}    {/* dress */}
        {px(4,17,2,2,STRAW)}{px(7,17,2,2,STRAW)} {/* legs */}
      </g>
    </g>
  );
}

// ─── THREE LITTLE PIGS ──────────────────────────────────────────────────────
// Three houses in a row — straw, sticks, brick
function PigsScene() {
  return (
    <g>
      {px(0,0,32,13,SKY)}
      {/* clouds */}
      {px(2,3,6,2,WHT)}{px(3,1,4,3,WHT)}{px(21,2,7,2,WHT)}{px(22,0,5,3,WHT)}
      {/* ground */}
      {px(0,13,32,11,GRN)}{px(0,13,32,1,GRND)}

      {/* house 1: straw (left) */}
      {px(1,10,8,4,STRAW)}{px(1,10,8,1,YEL)}
      {px(0,8,10,3,YEL)}{px(1,7,8,2,STRAW)}{px(2,6,6,2,YEL)}
      {px(4,11,2,4,STEM)}  {/* door */}
      {px(2,11,2,2,YEL)}   {/* window */}

      {/* house 2: sticks (center) */}
      {px(12,9,8,5,BRN)}{px(12,9,8,1,STEM)}
      {px(11,7,10,3,STEM)}{px(12,6,8,2,BRN)}{px(13,5,6,2,STEM)}
      {px(15,10,2,5,GRND)} {/* door */}
      {px(13,10,2,2,WHT)}{px(18,10,2,2,WHT)} {/* windows */}

      {/* house 3: brick (right) */}
      {px(23,8,8,6,BRICK)}{px(23,8,8,1,RED)}
      {px(22,6,10,3,RED)}{px(23,5,8,2,BRICK)}{px(25,4,4,2,RED)}
      {px(27,10,2,5,GRND)} {/* door */}
      {px(24,9,2,2,WATL)}{px(28,9,2,2,WATL)} {/* windows */}
      {/* brick pattern */}
      {px(23,8,1,1,RED)}{px(25,8,2,1,RED)}{px(28,8,2,1,RED)}
      {px(24,10,2,1,RED)}{px(27,10,1,1,RED)}{px(30,10,1,1,RED)}

      {/* three pigs — bounce */}
      <g className="pxchar">
        {/* pig 1 */}
        {px(2,13,3,3,PINK)}{px(3,12,2,2,TAN)}{px(2,16,1,1,PINK)}{px(4,16,1,1,PINK)}
        {px(3,12,1,1,BLK)}{px(4,12,1,1,BLK)}
        {/* pig 2 */}
        {px(13,13,3,3,PINK)}{px(14,12,2,2,TAN)}{px(13,16,1,1,PINK)}{px(15,16,1,1,PINK)}
        {px(14,12,1,1,BLK)}{px(15,12,1,1,BLK)}
        {/* pig 3 */}
        {px(24,13,3,3,PINK)}{px(25,12,2,2,TAN)}{px(24,16,1,1,PINK)}{px(26,16,1,1,PINK)}
        {px(25,12,1,1,BLK)}{px(26,12,1,1,BLK)}
      </g>

      {/* wolf lurking right */}
      {px(29,11,3,4,GRY)}{px(30,10,2,2,GRY)}{px(31,9,1,2,GRY)}
      {px(29,14,2,2,GRY)}{px(31,14,1,2,GRY)}{px(28,13,2,1,LGRY)}
      {px(30,10,1,1,BLK)}{px(30,13,1,1,BLK)} {/* eye, nose */}
    </g>
  );
}

const SCENES = {
  momotaro: MomotaroScene,
  urashima: UrashimaScene,
  kaguya:   KaguyaScene,
  goldilocks: GoldilocksScene,
  pigs:     PigsScene,
};

export default function PixelScene({ story = 'momotaro', style: extraStyle }) {
  const Scene = SCENES[story] ?? SCENES.momotaro;
  return (
    <svg
      viewBox="0 0 160 120"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: '100%',
        height: 'auto',
        display: 'block',
        imageRendering: 'pixelated',
        ...extraStyle,
      }}
    >
      <defs>
        <style>{BOUNCE_CSS}</style>
      </defs>
      <Scene />
    </svg>
  );
}
